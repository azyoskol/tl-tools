INSERT INTO teams VALUES
  ('11111111-1111-1111-1111-111111111111', 'Backend Team'),
  ('22222222-2222-2222-2222-222222222222', 'Frontend Team');

INSERT INTO events VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'git', 'pr_opened', '11111111-1111-1111-1111-111111111111', '{"author": "alice", "pr_id": "123"}', now()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'git', 'pr_merged', '11111111-1111-1111-1111-111111111111', '{"author": "alice", "pr_id": "123"}', now() - INTERVAL 1 DAY),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac', 'pm', 'task_created', '11111111-1111-1111-1111-111111111111', '{"assignee": "bob", "task_id": "task-1"}', now() - INTERVAL 2 DAY),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaad', 'pm', 'task_done', '11111111-1111-1111-1111-111111111111', '{"assignee": "bob", "task_id": "task-1", "story_points": 5}', now() - INTERVAL 1 DAY),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaae', 'pm', 'task_blocked', '11111111-1111-1111-1111-111111111111', '{"assignee": "charlie", "task_id": "task-2"}', now() - INTERVAL 3 HOUR),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaf', 'cicd', 'pipeline_success', '11111111-1111-1111-1111-111111111111', '{"pipeline_id": "pip-1", "project": "backend"}', now() - INTERVAL 4 HOUR),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaag', 'cicd', 'pipeline_failed', '11111111-1111-1111-1111-111111111111', '{"pipeline_id": "pip-2", "project": "backend"}', now() - INTERVAL 2 HOUR),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaah', 'git', 'pr_opened', '22222222-2222-2222-2222-222222222222', '{"author": "dave", "pr_id": "456"}', now() - INTERVAL 5 HOUR),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaai', 'git', 'pr_reviewed', '22222222-2222-2222-2222-222222222222', '{"author": "eve", "pr_id": "456"}', now() - INTERVAL 4 HOUR),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaj', 'pm', 'task_created', '22222222-2222-2222-2222-222222222222', '{"assignee": "frank", "task_id": "task-3"}', now() - INTERVAL 1 DAY);