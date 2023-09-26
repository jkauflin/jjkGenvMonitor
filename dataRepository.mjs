/*==============================================================================
(C) Copyright 2023 John J Kauflin, All rights reserved. 
-----------------------------------------------------------------------------
DESCRIPTION:  Module to take care of interactions with a database

-----------------------------------------------------------------------------
Modification History
2023-09-08 JJK  Initial version
=============================================================================*/
import 'dotenv/config'
import mariadb from 'mariadb';

export async function getConfig(currTemperature) {
	let conn
	let sr
	try {
		// establish a connection to MariaDB
		//conn = await pool.getConnection();
		conn = await mariadb.createConnection({ 
		  host: process.env.DB_HOST,
		  user: process.env.DB_USER, 
		  password: process.env.DB_PASS, 
		  port: process.env.DB_PORT,
		  database: process.env.DB_NAME,
		  dateStrings: true  
		})
  
		//const res = await conn.query("INSERT INTO myTable value (?, ?)", [1, "mariadb"]);
		const res = await conn.query("UPDATE genvMonitorConfig SET CurrTemperature = ?,LastUpdateTs=CURRENT_TIMESTAMP WHERE ConfigId = ?", 
			[currTemperature,1])
  
		var query = "SELECT * FROM genvMonitorConfig WHERE ConfigId = 1;"
		var rows = await conn.query(query)
		if (rows.length < 1) {
			throw "No config rows found"
		}
  
		sr = rows[0]
  
	} catch (err) {
		throw err;
	} finally {
	  	if (conn) {
			conn.close()
		}
	}
  
	return sr;
}

export async function completeRequest(returnMessage) {
	let conn;
	try {
		conn = await mariadb.createConnection({ 
		  host: process.env.DB_HOST,
		  user: process.env.DB_USER, 
		  password: process.env.DB_PASS, 
		  port: process.env.DB_PORT,
		  database: process.env.DB_NAME,
		  dateStrings: true  
		});
  
		const res = await conn.query("UPDATE genvMonitorConfig SET RequestCommand='',RequestValue='',ReturnMessage=?,LastUpdateTs=CURRENT_TIMESTAMP WHERE ConfigId = ?", 
		  [returnMessage,1])
  
	} catch (err) {
		throw err
	} finally {
		if (conn) {
			conn.close()
		}
	}
  
}
