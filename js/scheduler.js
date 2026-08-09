import {store} from './store.js';
import {DAY} from './utils.js';
import {getMastery} from './mastery.js';
const intervals=[1,1,3,7,14,30,60];
export function scheduleReview(conceptId,{correct=true,quality=3}={}){
  const state=store.getState(),old=state.reviews[conceptId]||{reviewCount:0};const mastery=getMastery(conceptId,state);let reviewCount=old.reviewCount||0;
  if(correct)reviewCount+=1;else reviewCount=Math.max(0,reviewCount-1);
  const base=correct?intervals[Math.min(intervals.length-1,Math.max(1,reviewCount+(mastery.level>=4?1:0)))]:(quality<=1?1:2);
  const nextReview=Date.now()+base*DAY;
  const review={reviewCount,nextReview,lastScheduled:Date.now(),intervalDays:base,lastResult:correct?'correct':'incorrect'};
  store.dispatch({type:'SCHEDULE_REVIEW',conceptId,review});return review;
}
export function getDueReviews(state=store.getState(),now=Date.now()){
  return Object.entries(state.reviews).filter(([,r])=>r?.nextReview&&r.nextReview<=now).sort((a,b)=>a[1].nextReview-b[1].nextReview).map(([conceptId,review])=>({conceptId,...review}));
}
export function nextReviewFor(conceptId,state=store.getState()){return state.reviews[conceptId]?.nextReview||null;}
