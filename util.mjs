/*==============================================================================
(C) Copyright 2023 John J Kauflin, All rights reserved. 
-----------------------------------------------------------------------------
DESCRIPTION:  Utility functions

-----------------------------------------------------------------------------
Modification History
2023-09-08 JJK  Initial version
=============================================================================*/

function paddy(num, padlen, padchar) {
    var pad_char = typeof padchar !== 'undefined' ? padchar : '0';
    var pad = new Array(1 + padlen).join(pad_char);
    return (pad + num).slice(-pad.length);
}
//var fu = paddy(14, 5); // 00014
//var bar = paddy(2, 4, '#'); // ###2

export function log(inStr) {
    let td = new Date();
    let tempMonth = td.getMonth() + 1;
    let tempDay = td.getDate();
    let formattedDate = td.getFullYear() + '-' + paddy(tempMonth,2) + '-' + paddy(tempDay,2);
    var dateStr = `${formattedDate} ${paddy(td.getHours(),2)}:${paddy(td.getMinutes(),2)}:${paddy(td.getSeconds(),2)}.${td.getMilliseconds()}`;
    console.log(dateStr + " " + inStr);
}
