import pool from '../db.js';

async function dropTable(){

    const dropTableQuery = `DROP TABLE IF EXISTS projects CASCADE;
                            DROP TABLE IF EXISTS projects CASCADE;`;

    try{
        await pool.query(dropTableQuery);
        console.log('Table drop successfully!!');
    } catch (error) {
        console.log('Error arrived...', error);
    }
}

//dropTable();

function reCreateTable(){


    const tableQuery = `
        CREATE TABLE users(
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        avatar_url VARCHAR(200)
        );

        CREATE TABLE projects(
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        owner_id INTEGER REFERENCES users(id),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')), 
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deadline DATE
        );
    `;

    pool.query(tableQuery, (error, results) => {
        if(error) {
            console.error('Error creating tables : ',error);
            return;
        }
        console.log('All tables created successfully!');
    });
    
}


reCreateTable();