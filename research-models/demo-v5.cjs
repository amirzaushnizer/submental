const today = [
 {time:'06:00',end:'07:00',title:'Post-sleep & personal time',detail:'Hygiene · breakfast · daily check-in',kind:'personal',status:'done'},
 {time:'07:00',end:'08:00',title:'Daily planning conference',detail:'Crew + mission control · Habitat comms',kind:'joint',status:'done'},
 {time:'08:00',end:'10:30',title:'CO₂ scrubber maintenance',detail:'With Specialist Evans · Life support bay',kind:'joint',status:'done'},
 {time:'10:30',end:'11:00',title:'Maintenance debrief',detail:'Technical notes · Mission log',kind:'focus',status:'done'},
 {time:'11:00',end:'12:00',title:'ARED resistive exercise',detail:'Exercise protocol · Health module',kind:'exercise',status:'done'},
 {time:'12:00',end:'14:00',title:'Lunch & payload preparation',detail:'Meal break followed by procedure review',kind:'personal',status:'done'},
 {time:'14:00',end:'16:00',title:'EVA suit preparation',detail:'Suit checks · Airlock 02 · With Specialist Evans',kind:'joint',status:'active'},
 {time:'16:00',end:'18:00',title:'Science data review',detail:'Independent work · Science module',kind:'focus',status:'next'},
 {time:'18:00',end:'21:00',title:'Dinner, private time & downlink',detail:'Protected personal time · Evening crew report',kind:'personal',status:'next'},
 {time:'21:00',end:'06:00',title:'Sleep opportunity',detail:'Protected rest · Crew quarters',kind:'recovery',status:'next'}
];
const tomorrowDense = [
 {time:'08:00',end:'10:30',title:'Complex robotics calibration',detail:'With Specialist Evans · Robotics bay',kind:'joint',label:'High complexity'},
 {time:'10:30',end:'13:00',title:'Payload deployment',detail:'Joint task · Procedure review required',kind:'joint',label:'High complexity'},
 {time:'13:00',end:'14:00',title:'Shared crew meal & briefing',detail:'Crew common area',kind:'joint',label:'Crew time'},
 {time:'14:00',end:'18:00',title:'Deep system diagnostics',detail:'4 hours · Continuous technical work',kind:'focus',label:'Long focus block'}
];
const tomorrowRecovery = [
 {time:'08:00',end:'10:30',title:'Solo inventory audit',detail:'Independent work · Logistics module',kind:'focus',label:'Changed · Solo work'},
 {time:'10:30',end:'13:00',title:'Hydroponics maintenance',detail:'Routine botany checks · Greenhouse',kind:'focus',label:'Changed · Lower demand'},
 {time:'13:00',end:'14:30',title:'Private rest & optional audio log',detail:'Meal included · Protected personal time',kind:'recovery',label:'Changed · 90 min protected'},
 {time:'14:30',end:'18:00',title:'Light diagnostics & guided VR break',detail:'Optional 15 min VR session · Breaks between checks',kind:'recovery',label:'Changed · Flexible pace'}
];
const initialState={isScheduleOptimized:false};
function scheduleReducer(state,action){
 switch(action.type){
  case 'APPROVE_OPTIMIZATION':return {...state,isScheduleOptimized:true};
  case 'RESET_DEMO':return {...initialState};
  default:throw new Error(`Unknown schedule action: ${action.type}`);
 }
}
function tomorrowFor(state){return state.isScheduleOptimized?tomorrowRecovery:tomorrowDense;}
const events=[
 {id:'friction',time:'10:14:22',title:'Possible coordination strain',color:'amber',speaker:'Vance → Evans',quote:'I already told you twice, leave the secondary valve alone, I’ll handle it myself.',tags:['Repeated disagreement','Individual ownership language'],details:'HR 104 bpm · Systolic BP estimate 142 mmHg · HRV 22 ms',note:'An assertive phrase is a review cue, not proof of hostility. Acoustic jitter and breathing pauses are not inferred from text.',reason:'Review tomorrow’s joint work and ask the crew for context.'},
 {id:'overload',time:'11:42:05',title:'Possible effort to understand',color:'cyan',speaker:'Vance → Mission control',quote:'Wait… repeat step 4? Uh, confirm telemetry parameter… say again?',tags:['Repeated clarification','Scripted reply gap: 4.8 s'],details:'HR 112 bpm · Respiratory rate 22/min · Low movement',note:'Clarification can be good safety behavior. Check radio delay, procedure complexity and exercise timing before interpreting it.',reason:'Split long technical blocks and keep time for questions.'},
 {id:'participation',time:'13:15:00',title:'Lower captured participation',color:'purple',speaker:'Shared briefing window',quote:'Fewer recorded turns than the personal example baseline in this shared task window.',tags:['Captured turns −65%','Matched task window'],details:'Transcript coverage 82% · No additional sensor finding',note:'Missing audio, task roles or private time may explain this change. It does not establish social withdrawal or a mental health condition.',reason:'Offer a private check-in; do not label the crewmember.'}
];
const trace={hr:[76,79,77,80,104,95,84,81,80,83,87,92,98,101,106,108,112,96,81,79,84,88,86,80,78,80,77,79,81,78],bp:[121,123,120,124,142,136,126,122,123,125,126,128,129,130,131,133,135,129,124,123,126,129,125,124,121,122,120,123,124,122],movement:[.15,.14,.12,.13,.2,.12,.11,.12,.15,.17,.9,1,.7,.25,.21,.19,.13,.12,.12,.15,.11,.15,.18,.12,.14,.1,.12,.14,.12,.1]};
module.exports={today,tomorrowDense,tomorrowRecovery,initialState,scheduleReducer,tomorrowFor,events,trace};
