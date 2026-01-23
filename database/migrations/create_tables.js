import pool from "../../db.js";

function createTable() {
  const tableQuery = `
        CREATE TABLE users(
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() 
        );

        CREATE TABLE projects(
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        owner_id INTEGER REFERENCES users(id),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')), 
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE tasks(
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
        priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        due_date DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX tasks_search_idx ON tasks USING GIN (search_vector);
        
        CREATE TABLE labels(
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        color VARCHAR(7) DEFAULT '#808080',
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE
        );


        CREATE TABLE task_labels(
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        label_id INTEGER REFERENCES labels(id) ON DELETE CASCADE,
        PRIMARY KEY (task_id, label_id)
        );

        CREATE TABLE activity_log (
        log_id SERIAL PRIMARY KEY,
        task_id INTEGER,
        action_type VARCHAR(10),
        changed_by TEXT DEFAULT CURRENT_USER,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        old_data JSONB, 
        new_data JSONB  
        );
    `;

  pool.query(tableQuery, (error, results) => {
    if (error) {
      console.error("Error creating tables : ", error);
      return;
    }
    console.log("All tables created successfully!");
  });
}

async function alterTable() {
  const alterQuery = `
    ALTER TABLE users 
    ADD COLUMN avatar_url VARCHAR(200);

    ALTER TABLE projects 
    ADD COLUMN deadline DATE;

    ALTER TABLE tasks 
    ADD COLUMN metadata JSONB;

    ALTER TABLE tasks
    ADD COLUMN search_vector tsvector;


    UPDATE tasks
    SET search_vector =
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''));


    CREATE INDEX tasks_search_idx
    ON tasks USING GIN (search_vector);
  `;

  try {
    await pool.query(alterQuery);
    console.log("data upadated successfully!");
  } catch (error) {
    console.error("error occour....", error);
  }
}

createTable();
//alterTable();
