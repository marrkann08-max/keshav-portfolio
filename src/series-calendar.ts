export const SERIES_START_DATE='2026-10-28';
export const SERIES_TIME_ZONE='America/Toronto';
const formatter=new Intl.DateTimeFormat('en-US',{timeZone:SERIES_TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'});

export function seriesDayAt(now:Date):number{
 const parts=formatter.formatToParts(now);
 const value=(type:string)=>Number(parts.find(part=>part.type===type)?.value);
 const localDate=Date.UTC(value('year'),value('month')-1,value('day'));
 const start=Date.parse(SERIES_START_DATE+'T00:00:00Z');
 return Math.max(1,Math.min(100,Math.floor((localDate-start)/86_400_000)+1));
}
