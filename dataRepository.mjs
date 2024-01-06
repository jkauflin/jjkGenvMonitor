/*==============================================================================
(C) Copyright 2023 John J Kauflin, All rights reserved. 
-----------------------------------------------------------------------------
DESCRIPTION:  Module to take care of interactions with a database

-----------------------------------------------------------------------------
Modification History
2023-09-08 JJK  Initial version
2023-09-26 JJK	Added function to save image data in database
2024-01-05 JJK	Modified to update datetime in image insert
2024-01-06 JJK  Modified the DB functions to stop throwing errors (if the
                calling code is not going to do anything different)
=============================================================================*/
import 'dotenv/config'
import mariadb from 'mariadb';
import {log,getDateStr} from './util.mjs'

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
		//throw err;
		// Just log the error instead of throwing for now
		console.log("in getConfig, "+err)
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
		})
  
		const res = await conn.query("UPDATE genvMonitorConfig SET RequestCommand='',RequestValue='',ReturnMessage=?,LastUpdateTs=CURRENT_TIMESTAMP WHERE ConfigId = ?", 
		  [returnMessage,1])
  
	} catch (err) {
		//throw err
		// Just log the error instead of throwing for now
		console.log("in completeRequest, "+err)
	} finally {
		if (conn) {
			conn.close()
		}
	}
}

export async function insertImage(base64ImgData) {
	let conn;
	try {
		conn = await mariadb.createConnection({ 
		  host: process.env.DB_HOST,
		  user: process.env.DB_USER, 
		  password: process.env.DB_PASS, 
		  port: process.env.DB_PORT,
		  database: process.env.DB_NAME,
		  dateStrings: true  
		})
  
		let tempDateStr = getDateStr()
		await conn.query("INSERT INTO genvMonitorImg (LastChangeTs,ImgData) VALUES (?,?) ", [tempDateStr,base64ImgData])

		// Purge images beyond a maximum number
		let rows = await conn.query("SELECT ImgId FROM genvMonitorImg ORDER BY ImgId DESC LIMIT 1;")
		let lastImgId = rows[0].ImgId
		let maxImages = 100
		await conn.query("DELETE FROM genvMonitorImg WHERE ImgId <= ? ", lastImgId - maxImages)

		//console.log("in insertImage, SUCCESSfully inserted image in DB")

	} catch (err) {
		//throw err
		// Just log the error instead of throwing for now
		console.log("in insertImage, "+err)
	} finally {
		if (conn) {
			conn.close()
		}
	}
}
