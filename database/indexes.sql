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


-- Bonus 2: Activity Log with Triggers

CREATE OR REPLACE FUNCTION log_task_changes()
RETURNS TRIGGER AS $$
BEGIN 
    IF(TG_OP = 'DELETE') THEN
        INSERT INTO activity_log(task_id, action_type, old_data)
        VALUES (OLD.id, 'DELETE', to_jsonb(OLD))
        RETURN OLD;

    ELSIF(TG_OP = 'UPDATE') THEN
        INSERT INTO activity_log(task_id, action_type, old_data, new_data)
        VALUES (NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW))
        RETURN NEW;

    ELSIF(TG_OP = 'INSERT') THEN
        INSERT INTO activity_log(task_id, action_type, new_data)
        VALUES (NEW.id, 'INSERT', to_jsonb(NEW))
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_task_changes
AFTER INSERT OR UPDATE OR DELETE ON tasks
FOR EACH ROW EXECUTE FUNCTION log_task_changes(); 

SELECT * FROM activity_log;
    

-- Bonus 3: Database Functions


CREATE FUNCTION calculate_project_completion(p_id INT)
RETURNS NUMERIC AS $$
DECLARE
    completion_percentage NUMERIC;
BEGIN
    SELECT 
        (COUNT(*) FILTER (WHERE status = 'done')::NUMERIC / 
         NULLIF(COUNT(*), 0)::NUMERIC) * 100
    INTO completion_percentage
    FROM tasks
    WHERE project_id = p_id;

    RETURN COALESCE(completion_percentage, 0); 
END;
$$ LANGUAGE plpgsql;


-- Bonus 4: Cursor-Based Pagination


CREATE INDEX idx_projects_cursor ON projects (created_at DESC, id DESC);

 