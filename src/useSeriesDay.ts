import {useEffect,useState} from 'react';
import {currentDay as publishedDay} from './content';
import {seriesDayAt} from './series-calendar';

export function useSeriesDay(){
 // Match the pre-rendered page, then refresh from Toronto's calendar in the browser.
 const [day,setDay]=useState(publishedDay);
 useEffect(()=>{
  let timer:ReturnType<typeof setTimeout>;
  const update=()=>{clearTimeout(timer);setDay(seriesDayAt(new Date()));timer=setTimeout(update,60_000-Date.now()%60_000+20)};
  const visible=()=>{if(!document.hidden)update()};
  update();document.addEventListener('visibilitychange',visible);window.addEventListener('focus',update);
  return()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',visible);window.removeEventListener('focus',update)};
 },[]);
 return day;
}
