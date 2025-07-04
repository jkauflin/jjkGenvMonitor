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
2024-12-30 JJK  Got new Config, MetricPoint, and Image container read and
				updates working
2025-05-30 JJK	Added getServerDb to get the current GenvConfig item
2025-07-04 JJK	Added getLatestConfigId to get id of the latest config rec
				and removed the cr update
=============================================================================*/
import 'dotenv/config'
import fs, { readFileSync } from 'node:fs'
import {log,getDateStr,addDays,daysFromDate,getPointDay,getPointDayTime} from './util.mjs'
import crypto from 'node:crypto'
// Import the Azure Cosmos DB SDK
import { CosmosClient } from '@azure/cosmos'

const cosmos_db_endpoint = process.env.GENV_DB_ENDPOINT
const cosmos_db_key = process.env.GENV_DB_KEY
const cosmos_db_id = process.env.GENV_DB_ID
const cosmos_db_config_id = process.env.GENV_DB_CONFIG_ID
const cosmos_db_metric_point_id = process.env.GENV_DB_METRIC_POINT_ID
const cosmos_db_image_id = process.env.GENV_DB_IMAGE_ID

// Create a CosmosClient instance 
const cosmosClient = new CosmosClient({
	endpoint: cosmos_db_endpoint,
	key: cosmos_db_key
})

const { database } = await cosmosClient.databases.createIfNotExists({ id: cosmos_db_id })
const { container: configContainer } = await database.containers.createIfNotExists({ id: cosmos_db_config_id });
const { container: metricPointContainer } = await database.containers.createIfNotExists({ id: cosmos_db_metric_point_id });
const { container: imageContainer } = await database.containers.createIfNotExists({ id: cosmos_db_image_id });

// Functions to interact with Azure Cosmos DB NoSQL

export async function getLatestConfigId() {
	let cr = null
	try {
		const query = {
			query: 'SELECT * FROM c ORDER BY c.ConfigId DESC OFFSET 0 LIMIT 1'
		};

		const { resources: results } = await configContainer.items
			.query(query, { enableCrossPartitionQuery: true })
			.fetchAll();

		if (results.length > 0) {
			cr = results[0];
		} else {
			console.log("in getLatestConfigId, No items found ")
		}

		return cr

	} catch (err) {
		//throw err
		// Just log the error instead of throwing for now
		console.log("in getLatestConfigId, "+err)
		return null
	}
}

export async function getServerDb(cr) {
	try {
		const { resource: item } = await configContainer.item(cr.id,cr.ConfigId).read()
		return item
	} catch (err) {
		//throw err
		// Just log the error instead of throwing for now
		console.log("in getServerDb, "+err)
		return null
	}
}

// Update configuration parameter values into the backend server database
/*
export async function updServerDb(cr) {
	try {
		cr.lastUpdateTs = getDateStr()
		configContainer.item(cr.id,cr.ConfigId).replace(cr); 
	} catch (err) {
		//throw err
		// Just log the error instead of throwing for now
		console.log("in updServerDb, "+err)
	}
}
*/

// Update configuration parameter values into the backend server database
export async function logMetricToServerDb(gmp) {
	try {
		metricPointContainer.items.create(gmp);
	} catch (err) {
		//throw err
		// Just log the error instead of throwing for now
		console.log("in logMetricToServerDb, "+err)
	}
}

export async function insertImage(base64ImgData) {
	try {
		let dateTimeStr = getDateStr()

		var imagePoint = {
			id: 'guid',
			PointDay: 20241225,
			PointDateTime: getDateStr(),
			PointDayTime: 24125959,
			ImgData: ""
		}

		imagePoint.id = crypto.randomUUID()
		imagePoint.PointDay = getPointDay(dateTimeStr)
		imagePoint.PointDateTime = dateTimeStr
		imagePoint.PointDayTime = getPointDayTime(dateTimeStr)
		imagePoint.ImgData = base64ImgData

		imageContainer.items.create(imagePoint);

	} catch (err) {
		//throw err
		// Just log the error instead of throwing for now
		console.log("in insertImage, "+err)
	}
}

