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
2024-03-05 JJK  Modified to get configuration parameters from the .env and
                auto-calculation (don't count on the server DB for anything).
				Added a updServerDb function to just update the config
				parameters into the backend DB
2024-03-08 JJK  Added an option of connectTimeout to createConnection and
				changed from default 1000 to 3000 (3 seconds to connect)
2024-12-22 JJK  Working on migration to Azure
=============================================================================*/
import 'dotenv/config'
import fs, { readFileSync } from 'node:fs'
//import mariadb from 'mariadb';
import {log,getDateStr,addDays,daysFromDate} from './util.mjs'


const { CosmosClient } = require("@azure/cosmos");

const endpoint = "https://your-account.documents.azure.com";
const key = "<database account masterkey>";
const client = new CosmosClient({ endpoint, key });


// Update configuration parameter values into the backend server database
export async function updServerDb(cr) {
	/*
	let conn;
	try {
		conn = await mariadb.createConnection({ 
		  host: process.env.DB_HOST,
		  user: process.env.DB_USER, 
		  password: process.env.DB_PASS, 
		  port: process.env.DB_PORT,
		  database: process.env.DB_NAME,
		  connectTimeout: 3000,
		  dateStrings: true  
		})
  
		cr.lastUpdateTs = getDateStr()

		let sqlStr = "UPDATE genvMonitorConfig SET ConfigDesc=?,GerminationStart=?,DaysToGerm=?,PlantingDate=?,HarvestDate=?,CureDate=?"+
						",ProductionDate=?,DaysToBloom=?,TargetTemperature=?,ConfigCheckInterval=?,HeatInterval=?,HeatDuration=?"+
						",CurrTemperature=?,LightDuration=?,WaterDuration=?,WaterInterval=?,LastWaterTs=?,LastWaterSecs=?,LastUpdateTs=?"+
						",LoggingOn=?,SelfieOn=?,AirInterval=?,AirDuration=?,LogMetricInterval=?"+
						" WHERE ConfigId=?"
		conn.query(sqlStr, [cr.configDesc,cr.germinationStart,cr.daysToGerm,cr.plantingDate,cr.harvestDate,cr.cureDate,cr.productionDate,
					cr.daysToBloom,cr.targetTemperature,cr.configCheckInterval,cr.heatInterval,cr.heatDuration,cr.currTemperature,
					cr.lightDuration,cr.waterDuration,cr.waterInterval,cr.lastWaterTs,cr.lastWaterSecs,cr.lastUpdateTs,
					cr.loggingOn,cr.selfieOn,cr.airInterval,cr.airDuration,cr.logMetricInterval,1])
  
	} catch (err) {
		//throw err
		// Just log the error instead of throwing for now
		console.log("in updServerDb, "+err)
	} finally {
		if (conn) {
			conn.close()
		}
	}
	*/
}


export async function getConfig(cr) {
	//let conn
	try {

		/*
		const { resources } = await container.items
		.query("SELECT * from c WHERE c.active = true", {
				partitionKey: ["foo", 100],
			  })
		.fetchAll();
	  	for (const item of resources) {
			console.log(`${item.name}, ${item.address.zip} `);
	  	}

		  const { resources } = await container.items
		  .query({
			query: "SELECT * from c WHERE c.isCapitol = @isCapitol",
			parameters: [{ name: "@isCapitol", value: true }]
		  })
		  .fetchAll();
		for (const city of resources) {
		  console.log(`${city.name}, ${city.state} is a capitol `);
		}
		*/

		// establish a connection to MariaDB
		//conn = await pool.getConnection();
		/*
		conn = await mariadb.createConnection({ 
		  host: process.env.DB_HOST,
		  user: process.env.DB_USER, 
		  password: process.env.DB_PASS, 
		  port: process.env.DB_PORT,
		  database: process.env.DB_NAME,
		  connectTimeout: 3000,
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
			cr.loggingOn = parseInt(rows[0].LoggingOn)
			cr.selfieOn = parseInt(rows[0].SelfieOn)
			cr.targetTemperature = parseInt(rows[0].TargetTemperature)

			cr.airInterval = parseFloat(rows[0].AirInterval)
			cr.airDuration = parseFloat(rows[0].AirDuration)
			cr.heatInterval = parseFloat(rows[0].HeatInterval)
			cr.heatDuration = parseFloat(rows[0].HeatDuration)

			cr.lastUpdateTs = rows[0].LastUpdateTs

			cr.requestCommand = rows[0].RequestCommand
			cr.requestValue = rows[0].RequestValue
		}
  
		// Set parameters according to days since planting
		//cr = autoSetParams(cr)

		// Update params back into the server DB
		cr.lastUpdateTs = getDateStr()
		conn.query("UPDATE genvMonitorConfig SET CurrTemperature=?,LightDuration=?,WaterDuration=?,WaterInterval=?,LastWaterTs=?,LastWaterSecs=?,LastUpdateTs=? WHERE ConfigId=?", 
			[cr.currTemperature,cr.lightDuration,cr.waterDuration,cr.waterInterval,cr.lastWaterTs,cr.lastWaterSecs,cr.lastUpdateTs,1])
		*/

	} catch (err) {
		/*
		if (initialGet) {
			console.log("ERR in getConfig (during init - will THROW ERR), "+err)
			throw err;
		} else {
		}
		*/
		console.log("ERR in getConfig (will just continue), "+err)
	} finally {
		/*
	  	if (conn) {
			conn.close()
		}
		*/
	}
  
	return cr;
}

export async function updateParams(cr) {
	/*
	let conn;
	try {
		conn = await mariadb.createConnection({ 
		  host: process.env.DB_HOST,
		  user: process.env.DB_USER, 
		  password: process.env.DB_PASS, 
		  port: process.env.DB_PORT,
		  database: process.env.DB_NAME,
		  connectTimeout: 3000,
		  dateStrings: true  
		})
  
		let sqlStr = "UPDATE genvMonitorConfig SET ConfigDesc=?,GerminationStart=?,DaysToGerm=?,PlantingDate=?,HarvestDate=?,CureDate=?"+
						",ProductionDate=?,DaysToBloom=?,TargetTemperature=?,ConfigCheckInterval=?,HeatInterval=?,HeatDuration=?"+
						",CurrTemperature=?,LightDuration=?,WaterDuration=?,WaterInterval=?,LastWaterTs=?,LastWaterSecs=?,LastUpdateTs=?"+
						",LoggingOn=?,SelfieOn=?"+
						" WHERE ConfigId=?"
		conn.query(sqlStr, [cr.configDesc,cr.germinationStart,cr.daysToGerm,cr.plantingDate,cr.harvestDate,cr.cureDate,cr.productionDate,
					cr.daysToBloom,cr.targetTemperature,cr.configCheckInterval,cr.heatInterval,cr.heatDuration,cr.currTemperature,
					cr.lightDuration,cr.waterDuration,cr.waterInterval,cr.lastWaterTs,cr.lastWaterSecs,cr.lastUpdateTs,
					cr.loggingOn,cr.selfieOn,1])
  
	} catch (err) {
		//throw err
		// Just log the error instead of throwing for now
		console.log("in updateParams, "+err)
	} finally {
		if (conn) {
			conn.close()
		}
	}
	*/
}

export async function completeRequest(returnMessage) {
	/*
	let conn;
	try {
		conn = await mariadb.createConnection({ 
		  host: process.env.DB_HOST,
		  user: process.env.DB_USER, 
		  password: process.env.DB_PASS, 
		  port: process.env.DB_PORT,
		  database: process.env.DB_NAME,
		  connectTimeout: 3000,
		  dateStrings: true  
		})
  
		let tempLastUpdateTs = getDateStr()
		conn.query("UPDATE genvMonitorConfig SET RequestCommand='',RequestValue='',ReturnMessage=?,LastUpdateTs=? WHERE ConfigId = ?", 
		  [returnMessage,tempLastUpdateTs,1])
  
	} catch (err) {
		//throw err
		// Just log the error instead of throwing for now
		console.log("in completeRequest, "+err)
	} finally {
		if (conn) {
			conn.close()
		}
	}
	*/
}

export async function insertImage(base64ImgData) {
	/*

const cities = [
  { id: "1", name: "Olympia", state: "WA", isCapitol: true },
  { id: "2", name: "Redmond", state: "WA", isCapitol: false },
  { id: "3", name: "Chicago", state: "IL", isCapitol: false }
];
for (const city of cities) {
  await container.items.create(city);
}

	let conn;
	try {
		conn = await mariadb.createConnection({ 
		  host: process.env.DB_HOST,
		  user: process.env.DB_USER, 
		  password: process.env.DB_PASS, 
		  port: process.env.DB_PORT,
		  database: process.env.DB_NAME,
		  connectTimeout: 3000,
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
	*/
}

export async function saveImageToFile() {
	/*
	let conn;
	try {
		conn = await mariadb.createConnection({ 
		  host: process.env.DB_HOST,
		  user: process.env.DB_USER, 
		  password: process.env.DB_PASS, 
		  port: process.env.DB_PORT,
		  database: process.env.DB_NAME,
		  connectTimeout: 3000,
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
	*/
}

