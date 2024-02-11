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
2024-02-07 JJK  Modifed to use the new Config Record for getting current
				values
=============================================================================*/
import 'dotenv/config'
import fs, { readFileSync } from 'node:fs'
import mariadb from 'mariadb';
import {log,getDateStr} from './util.mjs'

//export async function getConfig(currTemperature) {
export async function getConfig(cr) {
	let conn
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
  
		let tempDateStr = getDateStr()
		const res = await conn.query("UPDATE genvMonitorConfig SET CurrTemperature=?,LightDuration=?,WaterDuration=?,WaterInterval=?,LastWaterTs=?,LastWaterSecs=?,LastUpdateTs=? WHERE ConfigId=?", 
			[cr.currTemperature,cr.lightDuration,cr.waterDuration,cr.waterInterval,cr.lastWaterTs,cr.lastWaterSecs,tempDateStr,1])


		var query = "SELECT * FROM genvMonitorConfig WHERE ConfigId = 1;"
		var rows = await conn.query(query)
		if (rows.length > 0) {
			cr.configDesc = rows[0].ConfigDesc
			cr.daysToGerm = rows[0].DaysToGerm
			cr.daysToBloom = rows[0].DaysToBloom
			cr.germinationStart = rows[0].GerminationStart
			cr.plantingDate = rows[0].PlantingDate

			cr.configCheckInterval = parseInt(rows[0].ConfigCheckInterval)
			cr.logMetricInterval = parseInt(rows[0].LogMetricInterval)
			cr.targetTemperature = parseInt(rows[0].TargetTemperature)

			cr.airInterval = parseFloat(rows[0].AirInterval)
			cr.airDuration = parseFloat(rows[0].AirDuration)
			cr.heatInterval = parseFloat(rows[0].HeatInterval)
			cr.heatDuration = parseFloat(rows[0].HeatDuration)

			cr.lastUpdateTs = rows[0].LastUpdateTs
		}
  
	} catch (err) {
		//throw err;
		// Just log the error instead of throwing for now
		console.log("in getConfig, "+err)
	} finally {
	  	if (conn) {
			conn.close()
		}
	}
  
	return cr;
}

export async function updateParams(lightDuration,waterDuration,waterInterval) {
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
		const res = await conn.query("UPDATE genvMonitorConfig SET LightDuration=?,WaterDuration=?,WaterInterval=?,LastUpdateTs=? WHERE ConfigId = ?", 
		  [lightDuration,waterDuration,waterInterval,tempDateStr,1])

	} catch (err) {
		//throw err
		// Just log the error instead of throwing for now
		console.log("in updateParams, "+err)
	} finally {
		if (conn) {
			conn.close()
		}
	}
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
		let maxImages = 5000
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

export async function saveImageToFile() {
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
		console.log("in saveImageToFile")

		// Purge images beyond a maximum number
		//let rows = await conn.query("SELECT * FROM genvMonitorImg ORDER BY ImgId DESC LIMIT 3;")
		let rows = await conn.query("SELECT * FROM genvMonitorImg ;")
		let lastImgId = rows[0].ImgId

		for (let i = 0; i < rows.length; i++) {
			let base64Image = rows[i].ImgData.split(';base64,').pop();
			try {

				fs.writeFile(`C:/Users/johnk/Downloads/tempimg/${rows[i].ImgId}.jpg`, base64Image, {encoding: 'base64'}, function(err) {
					log(`rows[${i}].ImgId = ${rows[i].ImgId}`)
				})

				// file written successfully
			  } catch (err) {
				console.error(err);
			  }

		}


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

