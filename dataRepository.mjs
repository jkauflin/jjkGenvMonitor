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
import {log,getDateStr,daysFromDate} from './util.mjs'

// Function to set light and water parameters based on the days from Planting Date
export function autoSetParams(cr) {
    let days = daysFromDate(cr.plantingDate)
    //log("Days from PlantingDate = "+days)

    cr.lightDuration = 18.0
    if (days > 3) {
        cr.lightDuration = 20.0
    }

    cr.waterDuration = 5.0
    cr.waterInterval = 4.0

    if (days > 40) {
        cr.waterDuration = 26.0
        cr.waterInterval = 30.0
    } else if (days > 30) {
        cr.waterDuration = 24.0
        cr.waterInterval = 30.0
    } else if (days > 20) {
        cr.waterDuration = 20.0
        cr.waterInterval = 30.0
        // *** And add bottom
    } else if (days > 10) {
        cr.waterDuration = 16.0
        cr.waterInterval = 30.0
    } else if (days > 6) {
        cr.waterDuration = 8.0
        cr.waterInterval = 24.0
    } else if (days > 5) {
        cr.waterDuration = 6.0
        cr.waterInterval = 12.0
    } else if (days > 3) {
        cr.waterInterval = 8.0
    } else if (days > 1) {
        cr.waterInterval = 6.0
    }

    return cr
}

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

		var query = "SELECT * FROM genvMonitorConfig WHERE ConfigId = 1;"
		var rows = await conn.query(query)
		if (rows.length > 0) {
			cr.configDesc = rows[0].ConfigDesc
			cr.daysToGerm = rows[0].DaysToGerm
			cr.daysToBloom = rows[0].DaysToBloom
			cr.germinationStart = rows[0].GerminationStart
			cr.plantingDate = rows[0].PlantingDate

			cr.harvestDate = rows[0].HarvestDate
			cr.cureDate = rows[0].CureDate
			cr.productionDate = rows[0].ProductionDate

			cr.configCheckInterval = parseInt(rows[0].ConfigCheckInterval)
			cr.logMetricInterval = parseInt(rows[0].LogMetricInterval)
			cr.targetTemperature = parseInt(rows[0].TargetTemperature)

			cr.airInterval = parseFloat(rows[0].AirInterval)
			cr.airDuration = parseFloat(rows[0].AirDuration)
			cr.heatInterval = parseFloat(rows[0].HeatInterval)
			cr.heatDuration = parseFloat(rows[0].HeatDuration)

			cr.lastUpdateTs = rows[0].LastUpdateTs
		}
  
		// Set parameters according to days since planting
		cr = autoSetParams(cr)

		// Update params back into the server DB
		cr.lastUpdateTs = getDateStr()
		conn.query("UPDATE genvMonitorConfig SET CurrTemperature=?,LightDuration=?,WaterDuration=?,WaterInterval=?,LastWaterTs=?,LastWaterSecs=?,LastUpdateTs=? WHERE ConfigId=?", 
			[cr.currTemperature,cr.lightDuration,cr.waterDuration,cr.waterInterval,cr.lastWaterTs,cr.lastWaterSecs,cr.lastUpdateTs,1])

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

export async function updateParams(cr) {
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
  
		let sqlStr = "UPDATE genvMonitorConfig SET ConfigDesc=?,GerminationStart=?,DaysToGerm=?,PlantingDate=?,HarvestDate=?,CureDate=?"+
						",ProductionDate=?,DaysToBloom=?,TargetTemperature=?,ConfigCheckInterval=?,HeatInterval=?,HeatDuration=?"+
						",CurrTemperature=?,LightDuration=?,WaterDuration=?,WaterInterval=?,LastWaterTs=?,LastWaterSecs=?,LastUpdateTs=?"+
						" WHERE ConfigId=?"
		//const res = await conn.query(sqlStr, 
		conn.query(sqlStr, [cr.configDesc,cr.germinationStart,cr.daysToGerm,cr.plantingDate,cr.harvestDate,cr.cureDate,cr.productionDate,
					cr.daysToBloom,cr.targetTemperature,cr.configCheckInterval,cr.heatInterval,cr.heatDuration,cr.currTemperature,
					cr.lightDuration,cr.waterDuration,cr.waterInterval,cr.lastWaterTs,cr.lastWaterSecs,cr.lastUpdateTs,1])
  
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

