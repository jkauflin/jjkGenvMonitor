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
import {log} from './util.mjs'

/*
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER, 
  password: process.env.DB_PASS, 
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  dateStrings: true  
});
*/

export async function getConfig(currTemperature) {
  let conn;
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
      });

      //const res = await conn.query("INSERT INTO myTable value (?, ?)", [1, "mariadb"]);
      const res = await conn.query("UPDATE genvMonitorConfig SET CurrTemperature = ?,LastUpdateTs=CURRENT_TIMESTAMP WHERE ConfigId = ?", [currTemperature,1]);

/*
CREATE TABLE `genvMonitorConfig` (
  `ConfigId` int(4) NOT NULL,
  `ConfigDesc` varchar(1000) NOT NULL,
  `DaysToGerm` varchar(1000) NOT NULL,
  `DaysToBloom` varchar(1000) NOT NULL,
  `GerminationStart` datetime NOT NULL,
  `PlantingDate` datetime NOT NULL,
  `HarvestDate` datetime NOT NULL,
  `CureDate` datetime NOT NULL,
  `ProductionDate` datetime NOT NULL,
  `TargetTemperature` decimal(3,1) NOT NULL,
  `CurrTemperature` decimal(3,1) NOT NULL,
  `AirInterval` decimal(3,1) NOT NULL,
  `AirDuration` decimal(3,1) NOT NULL,
  `HeatInterval` decimal(3,1) NOT NULL,
  `HeatDuration` decimal(3,1) NOT NULL,
  `HeatDurationMin` decimal(3,1) NOT NULL,
  `HeatDurationMax` decimal(3,1) NOT NULL,
  `LightDuration` decimal(3,1) NOT NULL,
  `WaterDuration` decimal(3,1) NOT NULL,
  `WaterInterval` decimal(3,1) NOT NULL,
  `ConfigCheckInterval` int(11) NOT NULL,
  `LogMetricInterval` int(11) NOT NULL,
  `RequestCommand` varchar(100) NOT NULL,
  `RequestValue` varchar(100) NOT NULL,
  `ReturnMessage` varchar(100) NOT NULL
*/

      var query = "SELECT * FROM genvMonitorConfig WHERE ConfigId = 1;"
      var rows = await conn.query(query);
      if (rows.length < 1) {
          throw "No config rows found"
      }

      conn.close();
      //if (conn) conn.release(); //release to pool
      conn = null;

      return rows[0]

      /*
      for (var i = 0, len = rows.length; i < len; i++) {
        console.log(`MediaTypeId=${rows[i].MediaTypeId}  MediaTypeDesc=${rows[i].MediaTypeDesc} `);
      }
      */

  } catch (err) {
      throw err;
  } finally {
    if (conn) return conn.close();
    //if (conn) return conn.end();
    //if (conn) conn.release(); //release to pool
  }
}

export async function completeRequest(returnMessage) {
  let conn;
  try {
      // conn = await pool.getConnection();
      conn = await mariadb.createConnection({ 
        host: process.env.DB_HOST,
        user: process.env.DB_USER, 
        password: process.env.DB_PASS, 
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        dateStrings: true  
      });

      const res = await conn.query("UPDATE genvMonitorConfig SET RequestCommand='',RequestValue='',ReturnMessage=?,LastUpdateTs=CURRENT_TIMESTAMP WHERE ConfigId = ?", 
        [returnMessage,1]);
      conn.close();
      conn = null;

  } catch (err) {
      throw err;
  } finally {
    if (conn) return conn.close();
    //if (conn) conn.release(); //release to pool
  }

}

