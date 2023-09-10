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

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER, 
  password: process.env.DB_PASS, 
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  dateStrings: true  
});

export async function getConfig() {
  let conn;
  try {
      // establish a connection to MariaDB
      conn = await pool.getConnection();
      var query = "SELECT * FROM genvMonitorConfig;"
      var rows = await conn.query(query);
      if (rows.length < 1) {
          throw "No config rows found"
      }

      return rows[0]

      /*
      for (var i = 0, len = rows.length; i < len; i++) {
        console.log(`MediaTypeId=${rows[i].MediaTypeId}  MediaTypeDesc=${rows[i].MediaTypeDesc} `);
      }
      */

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
  `AirInterval` decimal(3,1) NOT NULL,
  `AirDuration` decimal(3,1) NOT NULL,
  `HeatInterval` decimal(3,1) NOT NULL,
  `HeatDuration` decimal(3,1) NOT NULL,
  `HeatDurationMin` decimal(3,1) NOT NULL,
  `HeatDurationMax` decimal(3,1) NOT NULL,
  `LightDuration` decimal(3,1) NOT NULL,
  `WaterDuration` decimal(3,1) NOT NULL,
  `WaterInterval` decimal(3,1) NOT NULL
  ConfigCheckInterval  20
  LogMetricInterval    10
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `genvMonitorConfig` (`ConfigId`, `ConfigDesc`, `DaysToGerm`, `DaysToBloom`, `GerminationStart`, `PlantingDate`, `HarvestDate`, `CureDate`, `ProductionDate`, `TargetTemperature`, `AirInterval`, `AirDuration`, `HeatInterval`, `HeatDuration`, `HeatDurationMin`, `HeatDurationMax`, `LightDuration`, `WaterDuration`, `WaterInterval`) VALUES
(1, 'JJK #5', '2 days to germinate, 2 days for good tap root', '75 days from planting', 
'2023-09-02 00:00:00', '2023-09-05 00:00:00', '2023-11-18 00:00:00', '2023-12-01 00:00:00', '2023-12-14 00:00:00', 
'77.0', '1.0', '1.0', '2.0', '0.8', '0.5', '2.0', '16.0', '6.0', '5.0');
*/

  } catch (err) {
      throw err;
  } finally {
      if (conn) conn.release(); //release to pool
  }
  // [{"name":"rob"},{"name":"tracy"},{"name":"duke"},{"name":"sam"}]

/*
  async function asyncFunction() {
    let conn;
    try {
  
      conn = await pool.getConnection();
      const rows = await conn.query("SELECT 1 as val");
      // rows: [ {val: 1}, meta: ... ]
  
      const res = await conn.query("INSERT INTO myTable value (?, ?)", [1, "mariadb"]);
      // res: { affectedRows: 1, insertId: 1, warningStatus: 0 }
  
    } finally {
      if (conn) conn.release(); //release to pool
    }
  }
*/

}

