#!/usr/bin/env bash
set -euo pipefail

: "${GH_TOKEN:?PROJECTS_TOKEN must be provided as GH_TOKEN}"
: "${OWNER_NODE_ID:?OWNER_NODE_ID is required}"
: "${TARGET_REPO:?TARGET_REPO is required}"
: "${EPIC_ISSUE:?EPIC_ISSUE is required}"
: "${PROJECT_TITLE:?PROJECT_TITLE is required}"

BOARD_VIEW_NAME="${BOARD_VIEW_NAME:-Epic Board}"
RELATED_ITEMS="${RELATED_ITEMS:-}"

repo_json=$(gh api "repos/$TARGET_REPO")
repo_id=$(echo "$repo_json" | jq -r '.node_id')
epic_json=$(gh api "repos/$TARGET_REPO/issues/$EPIC_ISSUE")
epic_id=$(echo "$epic_json" | jq -r '.node_id')
epic_title=$(echo "$epic_json" | jq -r '.title')

query='query { viewer { projectsV2(first: 100) { nodes { id number title url } } } }'
projects_json=$(gh api graphql -f query="$query")
project_id=$(echo "$projects_json" | jq -r --arg title "$PROJECT_TITLE" '.data.viewer.projectsV2.nodes[] | select(.title == $title) | .id' | head -n1)

if [ -z "$project_id" ]; then
  mutation='mutation($ownerId: ID!, $title: String!) { createProjectV2(input: {ownerId: $ownerId, title: $title}) { projectV2 { id number title url } } }'
  created=$(gh api graphql -f query="$mutation" -f ownerId="$OWNER_NODE_ID" -f title="$PROJECT_TITLE")
  project_id=$(echo "$created" | jq -r '.data.createProjectV2.projectV2.id')
  project_number=$(echo "$created" | jq -r '.data.createProjectV2.projectV2.number')
  project_url=$(echo "$created" | jq -r '.data.createProjectV2.projectV2.url')
  echo "Created project #$project_number: $PROJECT_TITLE"
else
  project_number=$(echo "$projects_json" | jq -r --arg id "$project_id" '.data.viewer.projectsV2.nodes[] | select(.id == $id) | .number')
  project_url=$(echo "$projects_json" | jq -r --arg id "$project_id" '.data.viewer.projectsV2.nodes[] | select(.id == $id) | .url')
  echo "Using existing project #$project_number: $PROJECT_TITLE"
fi

link_mutation='mutation($projectId: ID!, $repositoryId: ID!) { linkProjectV2ToRepository(input: {projectId: $projectId, repositoryId: $repositoryId}) { repository { id } } }'
gh api graphql -f query="$link_mutation" -f projectId="$project_id" -f repositoryId="$repo_id" >/dev/null || true

fields_query='query($id: ID!) { node(id: $id) { ... on ProjectV2 { fields(first: 100) { nodes { ... on ProjectV2SingleSelectField { id name options { id name } } } } } } }'
fields_json=$(gh api graphql -f query="$fields_query" -f id="$project_id")
status_id=$(echo "$fields_json" | jq -r '.data.node.fields.nodes[] | select(.name == "Status") | .id' | head -n1)

if [ -z "$status_id" ]; then
  echo "GitHub did not expose the native Status field."
  exit 1
fi

current_names=$(echo "$fields_json" | jq -c '[.data.node.fields.nodes[] | select(.name == "Status") | .options[].name]')
wanted_names='["Todo","In Progress","Testing","Done"]'

if [ "$current_names" != "$wanted_names" ]; then
  mutation='mutation($input: UpdateProjectV2FieldInput!) { updateProjectV2Field(input: $input) { projectV2Field { ... on ProjectV2SingleSelectField { id name options { id name } } } } }'
  payload=$(jq -n \
    --arg query "$mutation" \
    --arg fieldId "$status_id" \
    '{query:$query,variables:{input:{fieldId:$fieldId,singleSelectOptions:[
      {name:"Todo",color:"GRAY",description:"Ready to be worked"},
      {name:"In Progress",color:"BLUE",description:"Currently being worked"},
      {name:"Testing",color:"YELLOW",description:"Awaiting or undergoing verification"},
      {name:"Done",color:"GREEN",description:"Completed and accepted"}
    ]}}}')
  echo "$payload" | gh api graphql --input - >/dev/null
  echo "Configured status workflow"
fi

fields_json=$(gh api graphql -f query="$fields_query" -f id="$project_id")
status_id=$(echo "$fields_json" | jq -r '.data.node.fields.nodes[] | select(.name == "Status") | .id' | head -n1)
todo_id=$(echo "$fields_json" | jq -r '.data.node.fields.nodes[] | select(.name == "Status") | .options[] | select(.name == "Todo") | .id')
progress_id=$(echo "$fields_json" | jq -r '.data.node.fields.nodes[] | select(.name == "Status") | .options[] | select(.name == "In Progress") | .id')
testing_id=$(echo "$fields_json" | jq -r '.data.node.fields.nodes[] | select(.name == "Status") | .options[] | select(.name == "Testing") | .id')
done_id=$(echo "$fields_json" | jq -r '.data.node.fields.nodes[] | select(.name == "Status") | .options[] | select(.name == "Done") | .id')

views_query='query($id: ID!) { node(id: $id) { ... on ProjectV2 { views(first: 100) { nodes { id name layout number } } } } }'
views_json=$(gh api graphql -f query="$views_query" -f id="$project_id")
existing_view=$(echo "$views_json" | jq -r --arg name "$BOARD_VIEW_NAME" '.data.node.views.nodes[] | select(.name == $name) | .id' | head -n1)
if [ -z "$existing_view" ]; then
  mutation='mutation($input: CreateProjectV2ViewInput!) { createProjectV2View(input: $input) { projectV2View { id name number layout } } }'
  payload=$(jq -n --arg query "$mutation" --arg projectId "$project_id" --arg name "$BOARD_VIEW_NAME" \
    '{query:$query,variables:{input:{projectId:$projectId,name:$name,layout:"BOARD_LAYOUT"}}}')
  echo "$payload" | gh api graphql --input - >/dev/null
  echo "Created board view: $BOARD_VIEW_NAME"
fi

resolve_status() {
  case "$1" in
    todo) echo "$todo_id" ;;
    in_progress) echo "$progress_id" ;;
    testing) echo "$testing_id" ;;
    done) echo "$done_id" ;;
    *) echo "Unknown status: $1" >&2; return 1 ;;
  esac
}

add_item() {
  local content_id="$1"
  local option_id="$2"
  local label="$3"

  local items_query='query($id: ID!) { node(id: $id) { ... on ProjectV2 { items(first: 100) { nodes { id content { ... on Issue { id } ... on PullRequest { id } } } } } } }'
  local items_json item_id
  items_json=$(gh api graphql -f query="$items_query" -f id="$project_id")
  item_id=$(echo "$items_json" | jq -r --arg content "$content_id" '.data.node.items.nodes[] | select(.content.id == $content) | .id' | head -n1)

  if [ -z "$item_id" ]; then
    local add_mutation added
    add_mutation='mutation($projectId: ID!, $contentId: ID!) { addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) { item { id } } }'
    added=$(gh api graphql -f query="$add_mutation" -f projectId="$project_id" -f contentId="$content_id")
    item_id=$(echo "$added" | jq -r '.data.addProjectV2ItemById.item.id')
    echo "Added $label"
  else
    echo "$label already present"
  fi

  local update_mutation
  update_mutation='mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) { updateProjectV2ItemFieldValue(input: {projectId: $projectId, itemId: $itemId, fieldId: $fieldId, value: {singleSelectOptionId: $optionId}}) { projectV2Item { id } } }'
  gh api graphql -f query="$update_mutation" -f projectId="$project_id" -f itemId="$item_id" -f fieldId="$status_id" -f optionId="$option_id" >/dev/null
}

add_item "$epic_id" "$progress_id" "Epic #$EPIC_ISSUE"

if [ -n "${RELATED_ITEMS// /}" ]; then
  IFS=',' read -ra entries <<< "$RELATED_ITEMS"
  for entry in "${entries[@]}"; do
    entry=$(echo "$entry" | xargs)
    IFS=':' read -r kind number status <<< "$entry"
    option_id=$(resolve_status "$status")

    case "$kind" in
      issue) content_id=$(gh api "repos/$TARGET_REPO/issues/$number" --jq '.node_id') ;;
      pr) content_id=$(gh api "repos/$TARGET_REPO/pulls/$number" --jq '.node_id') ;;
      *) echo "Unknown item type: $kind"; exit 1 ;;
    esac

    add_item "$content_id" "$option_id" "$kind #$number"
  done
fi

body=$(echo "$epic_json" | jq -r '.body // ""')
if ! grep -Fq '## Epic board' <<< "$body"; then
  addition=$(printf '\n\n## Epic board\n[**%s · Project #%s**](%s)\n\nBoard status workflow: **Todo → In Progress → Testing → Done**.\n' "$PROJECT_TITLE" "$project_number" "$project_url")
  new_body="$body$addition"
  jq -n --arg body "$new_body" '{body:$body}' | gh api --method PATCH "repos/$TARGET_REPO/issues/$EPIC_ISSUE" --input - >/dev/null
  echo "Added board link to epic issue"
else
  echo "Epic already contains a board section"
fi

if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  {
    echo "### Epic board managed"
    echo "Repository: $TARGET_REPO"
    echo "Epic: #$EPIC_ISSUE — $epic_title"
    echo "Project: $project_url"
    echo "Workflow: Todo / In Progress / Testing / Done"
  } >> "$GITHUB_STEP_SUMMARY"
fi

echo "EPIC_BOARD_URL=$project_url"
