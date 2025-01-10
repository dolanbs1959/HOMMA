"use strict";(self.webpackChunkapp=self.webpackChunkapp||[]).push([[3709],{3709:(O,d,s)=>{s.r(d),s.d(d,{StaffTasksModule:()=>Z});var l=s(6814),a=s(849),u=s(95),p=s(4408),e=s(9212),f=s(6311),m=s(2496);const h=t=>({"reviews-due":t});function x(t,r){if(1&t&&(e.TgZ(0,"p",13),e._uU(1),e.qZA()),2&t){const o=e.oxw().$implicit;e.Q6J("ngClass",e.VKq(2,h,o.status.includes("Reviews"))),e.xp6(),e.hij("1 on 1's Due: ",o.p1on1sDue,"")}}const M=t=>({"status-overdue":t});function b(t,r){if(1&t&&(e.TgZ(0,"ion-card")(1,"ion-card-content")(2,"ion-card-header")(3,"ion-card-title"),e._uU(4),e.qZA()(),e.TgZ(5,"p"),e._uU(6),e.qZA(),e.TgZ(7,"p"),e._uU(8),e.qZA(),e.TgZ(9,"p",13),e._uU(10),e.ALo(11,"extractText"),e.qZA(),e.TgZ(12,"p"),e._uU(13),e.ALo(14,"extractText"),e.qZA(),e.TgZ(15,"p"),e._uU(16),e.qZA(),e.YNc(17,x,2,4,"p",14),e.qZA()()),2&t){const o=r.$implicit;e.xp6(4),e.Oqu(o.taskName),e.xp6(2),e.hij("Role: ",o.role,""),e.xp6(2),e.hij("House Name: ",o.houseName,""),e.xp6(),e.Q6J("ngClass",e.VKq(12,M,o.status.includes("Due"))),e.xp6(),e.hij("Status: ",e.lcZ(11,8,o.status)," "),e.xp6(3),e.hij("Frequency: ",e.lcZ(14,10,o.frequency),""),e.xp6(3),e.hij("Priority: ",o.priority,""),e.xp6(),e.Q6J("ngIf",o.taskName.includes("Reviews"))}}let k=(()=>{var t;class r{constructor(i,n,c,g){this.quickbaseService=i,this.route=n,this.location=c,this.router=g,this.HouseLeaderName="",this.theHouseName="",this.HLphone="",this.residentPhoto="",this.residentFullName="",this.weeklyHouseMeeting="",this.maxMeetingDate="",this.tasks=[],this.quickbaseService.residentData.subscribe(_=>{this.residentData=_})}addWeeklyHouseMeeting(){const i=new Date,n=new Date(this.maxMeetingDate),c=Math.ceil((i.getTime()-n.getTime())/864e5)-1;console.log("Diff in days:",c),(!(c<7)||window.confirm(`Your last meeting was just ${c} day(s) ago - click OK if you're sure you want to add a new Weekly House Meeting?`))&&this.router.navigate(["/weeklyhousemeeting"],{state:{theHouseName:this.theHouseName,HouseLeaderName:this.HouseLeaderName,HLphone:this.HLphone,maxMeetingDate:this.maxMeetingDate}})}goBack(){this.location.back()}ngOnInit(){this.residentData=this.quickbaseService.residentData;const i=this.router.getCurrentNavigation();if(i&&i.extras.state){console.log("State from router:",i.extras.state);const n=i.extras.state;this.tasks=n.tasks,this.theHouseName=n.theHouseName,this.HouseLeaderName=n.HouseLeaderName,this.HLphone=n.HLphone,this.maxMeetingDate=n.maxMeetingDate}}}return(t=r).\u0275fac=function(i){return new(i||t)(e.Y36(f.x),e.Y36(p.gz),e.Y36(l.Ye),e.Y36(p.F0))},t.\u0275cmp=e.Xpm({type:t,selectors:[["HOMMA-staff-tasks"]],decls:34,vars:10,consts:[[3,"translucent"],["color","Primary"],[3,"fullscreen"],[1,"ion-text-center"],["src","assets/logo/HOM3.png","alt","Logo"],[1,"ion-text-center","first-title"],[1,"ion-text-left"],[1,"weekly-meeting-message"],[1,"wrapper"],[1,"ion-activatable","ripple-parent","rounded-rectangle","ripple-effect-lightblue",3,"click"],[1,"body-text"],[4,"ngFor","ngForOf"],[1,"ion-activatable","ripple-parent","rounded-rectangle","ripple-effect-blue",3,"click"],[3,"ngClass"],[3,"ngClass",4,"ngIf"]],template:function(i,n){1&i&&(e.TgZ(0,"ion-header",0)(1,"ion-toolbar")(2,"ion-title",1),e._uU(3," HOM Mobile Assistant - Staff Tasks Assignments "),e.qZA()()(),e.TgZ(4,"ion-content",2)(5,"ion-card",3),e._UZ(6,"img",4)(7,"br"),e.TgZ(8,"ion-card-header")(9,"ion-card-title",5),e._uU(10,"Staff Tasks Assignments"),e.qZA(),e.TgZ(11,"ion-card-subtitle",6),e._uU(12),e._UZ(13,"br"),e._uU(14),e._UZ(15,"br"),e._uU(16),e._UZ(17,"br"),e.qZA()()(),e.TgZ(18,"div",7),e._UZ(19,"br"),e.TgZ(20,"ion-card-subtitle",3),e._uU(21),e.ALo(22,"date"),e.qZA()(),e.TgZ(23,"div",8)(24,"div",9),e.NdJ("click",function(){return n.addWeeklyHouseMeeting()}),e._uU(25," Add Weekly House Meeting "),e._UZ(26,"ion-ripple-effect"),e.qZA(),e._UZ(27,"div",10),e.qZA(),e.YNc(28,b,18,14,"ion-card",11),e._UZ(29,"router-outlet"),e.TgZ(30,"div",8)(31,"div",12),e.NdJ("click",function(){return n.goBack()}),e._uU(32," Back/Start Over "),e._UZ(33,"ion-ripple-effect"),e.qZA()()()),2&i&&(e.Q6J("translucent",!0),e.xp6(4),e.Q6J("fullscreen",!0),e.xp6(8),e.Oqu(n.theHouseName),e.xp6(2),e.hij(" House Leader: ",n.HouseLeaderName,""),e.xp6(2),e.hij(" Phone: ",n.HLphone,""),e.xp6(5),e.hij("Your last weekly house meeting was on: ",e.xi3(22,7,n.maxMeetingDate,"MMM-dd-yyyy"),""),e.xp6(7),e.Q6J("ngForOf",n.tasks))},dependencies:[l.mk,l.sg,l.O5,a.PM,a.FN,a.Zi,a.tO,a.Dq,a.W2,a.Gu,a.H$,a.wd,a.sr,p.lC,l.uU,m.d],styles:["ion-header[_ngcontent-%COMP%]{--ion-background-color: #4194ab !important;--ion-color-base: #fff !important}ion-title[_ngcontent-%COMP%]{--ion-color-base: #fff !important;font-size:16px}ion-card-header[_ngcontent-%COMP%]{--padding-bottom: 0;font-size:16px;font-weight:700}ion-card-subtitle[_ngcontent-%COMP%]{--ion-color-base: #000 !important;font-size:12px;font-weight:inherit}ion-card-title[_ngcontent-%COMP%]{text-align:center;border-bottom:1px solid #000}.first-title[_ngcontent-%COMP%]{border-bottom:none}.error-message[_ngcontent-%COMP%]{color:red;font-size:20px;margin-top:10px}ion-card[_ngcontent-%COMP%]{justify-content:center}ion-card[_ngcontent-%COMP%]   .error-message-text[_ngcontent-%COMP%]{text-align:center;color:#87130a}ion-select[_ngcontent-%COMP%]{margin:0;padding:10px}form[_ngcontent-%COMP%]{margin:0;padding:10px}.ripple-effect-blue[_ngcontent-%COMP%]{color:#010384}.ripple-effect-lightblue[_ngcontent-%COMP%]{color:#00c8ff;width:100px}.ripple-effect-orange[_ngcontent-%COMP%]{color:#6c5105;font-size:x-small}.weekly-meeting-message[_ngcontent-%COMP%]   ion-card-subtitle[_ngcontent-%COMP%]{text-align:center;font-size:12px;color:#010384;font-weight:700;margin-top:0;margin-bottom:0;padding-top:0;padding-bottom:0}.wrapper[_ngcontent-%COMP%]{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;height:50px;width:300px;margin:0 auto}b[_ngcontent-%COMP%]{width:100%}.center-div[_ngcontent-%COMP%]{display:flex;justify-content:center;align-items:center;height:100%;width:100%}.ripple-parent[_ngcontent-%COMP%]{display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;border:1px solid #4194ab;width:100%;height:50px;border-radius:8px}.status-overdue[_ngcontent-%COMP%], .reviews-due[_ngcontent-%COMP%]{color:#c92419;font-size:16px;font-weight:700}.rounded-rectangle[_ngcontent-%COMP%]{width:300px;height:50px;margin-bottom:5px;border-radius:8px}.bordered-input[_ngcontent-%COMP%]{border:1px solid #4194ab;white-space:pre-wrap}.stacked-label[_ngcontent-%COMP%]   label[_ngcontent-%COMP%]{display:block;margin-bottom:5px;color:#4194ab}ion-button[_ngcontent-%COMP%]{--padding-start: 10px;--padding-end: 10px;--padding-top: 0px;--padding-bottom: 0px;--background: #87130a;--color: #fff;--border-radius: 8px;font-size:12px;font-weight:700}.body-text[_ngcontent-%COMP%]{font-size:12px;line-height:16px;margin-top:0}"]}),r})();var C=s(1664);let Z=(()=>{var t;class r{}return(t=r).\u0275fac=function(i){return new(i||t)},t.\u0275mod=e.oAB({type:t}),t.\u0275inj=e.cJS({imports:[l.ez,u.u5,a.Pc,C.e,p.Bz.forChild([{path:"",component:k}])]}),r})()}}]);