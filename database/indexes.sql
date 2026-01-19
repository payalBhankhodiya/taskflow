-- 6.1 Indexing


-- 6.1(1)     

EXPLAIN ANALYZE (SELECT * FROM tasks WHERE status = 'todo'); 


-- 6.1(2)


CREATE INDEX idx_title ON projects(title);

CREATE INDEX idx_email ON users(email);

CREATE INDEX idx_projectID ON tasks(project_id);

CREATE INDEX idx_users_priority ON tasks(priority)

-- WHERE QUERY :
-- SELECT * FROM tasks WHERE priority = 'medium';


-- 6.1(3)

CREATE INDEX idx_tasks_name ON tasks(id,username);


-- 6.2 Views


CREATE VIEW project_summary AS
SELECT 
    p.name,
    u.username,
    COUNT(t.status),
    COUNT(p.owner_id)
FROM projects p
LEFT JOIN users u
ON p.id = p.owner_id
LEFT JOIN tasks t
ON p.id = t.project_id
GROUP BY p.id,p.name,u.username;

SELECT * FROM project_summary;




CREATE VIEW user_workload AS
SELECT 
    u.id,
    u.username,
    COUNT(t.id) AS total_assigned_tasks,
    COUNT(t.id) FILTER (WHERE t.due_date < CURRENT_DATE) AS overdue_tasks,
    COUNT(t.id) FILTER (WHERE t.due_date >= CURRENT_DATE AND t.due_date < CURRENT_DATE + INTERVAL '7 days') AS tasks_due_this_week
FROM users u
LEFT JOIN tasks t
ON u.id = t.assignee_id
GROUP BY u.id,u.username;

SELECT * FROM user_workload;







CREATE VIEW overdue_tasks AS
SELECT 
    id, 
    title, 
    due_date, 
    assignee_id
FROM 
    tasks
WHERE 
    status != 'done'  
    AND due_date < CURRENT_DATE; 


SELECT * FROM overdue_tasks;