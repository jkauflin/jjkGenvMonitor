/*==============================================================================
(C) Copyright 2023 John J Kauflin, All rights reserved. 
-----------------------------------------------------------------------------
DESCRIPTION:  Utility functions

-----------------------------------------------------------------------------
Modification History
2023-09-08 JJK  Initial version
2024-01-04 JJK  Added getDateStr
=============================================================================*/

function paddy(num, padlen, padchar) {
    var pad_char = typeof padchar !== 'undefined' ? padchar : '0'
    var pad = new Array(1 + padlen).join(pad_char)
    return (pad + num).slice(-pad.length)
}
//var fu = paddy(14, 5); // 00014
//var bar = paddy(2, 4, '#'); // ###2

export function log(inStr) {
    let td = new Date()
    let tempMonth = td.getMonth() + 1
    let tempDay = td.getDate()
    let formattedDate = td.getFullYear() + '-' + paddy(tempMonth,2) + '-' + paddy(tempDay,2)
    var dateStr = `${formattedDate} ${paddy(td.getHours(),2)}:${paddy(td.getMinutes(),2)}:${paddy(td.getSeconds(),2)}.${td.getMilliseconds()}`
    console.log(dateStr + " " + inStr)
}

export function getDateStr() {
    let td = new Date()
    let tempMonth = td.getMonth() + 1
    let tempDay = td.getDate()
    let formattedDate = td.getFullYear() + '-' + paddy(tempMonth,2) + '-' + paddy(tempDay,2)
    var dateStr = `${formattedDate} ${paddy(td.getHours(),2)}:${paddy(td.getMinutes(),2)}:${paddy(td.getSeconds(),2)}`
    return(dateStr)
}

export function daysFromDate(dateStr) {
    let date1 = new Date(dateStr);
    let date2 = new Date();

    // Calculating the time difference
    // of two dates
    let Difference_In_Time =
        date2.getTime() - date1.getTime();
     
    // Calculating the no. of days between
    // two dates
    let Difference_In_Days =
        Math.round
            (Difference_In_Time / (1000 * 3600 * 24));
     
    // To display the final no. of days (result)
    /*
    console.log
        ("Total number of days between dates:\n" +
            date1.toDateString() + " and " +
            date2.toDateString() +
            " is: " + Difference_In_Days + " days");    
    */
   
    return(Difference_In_Days-1)
}
