"use strict";(self.webpackChunkapp=self.webpackChunkapp||[]).push([[3687],{3687:(w,m,c)=>{c.r(m),c.d(m,{LoginPageModule:()=>k});var g=c(6814),d=c(95),r=c(849),u=c(4408),P=c(9397),b=c(7398),e=c(9212),v=c(6311);function Z(o,s){if(1&o&&(e.TgZ(0,"div",13),e._uU(1),e.qZA()),2&o){const i=e.oxw();e.xp6(),e.hij(" ",i.errorMessage," ")}}function T(o,s){if(1&o&&(e.TgZ(0,"ion-select-option",19),e._uU(1),e.qZA()),2&o){const i=s.$implicit;e.Q6J("value",i),e.xp6(),e.hij(" ",i," ")}}function C(o,s){if(1&o){const i=e.EpF();e.TgZ(0,"ion-card",14)(1,"ion-card-subtitle",14)(2,"i"),e._uU(3,"Enter your credentials and tap the blue button to enter."),e.qZA()(),e.TgZ(4,"ion-card-content")(5,"ion-item")(6,"ion-select",15),e.Uc_("ngModelChange",function(t){e.CHM(i);const a=e.oxw();return e.nJJ(a.housename,t)||(a.housename=t),e.KtG(t)}),e.YNc(7,T,2,2,"ion-select-option",16),e.ALo(8,"async"),e.qZA()(),e._UZ(9,"br"),e.TgZ(10,"ion-item")(11,"ion-input",17),e.Uc_("ngModelChange",function(t){e.CHM(i);const a=e.oxw();return e.nJJ(a.staffID,t)||(a.staffID=t),e.KtG(t)}),e.qZA()(),e._UZ(12,"br"),e.TgZ(13,"ion-button",18),e.NdJ("click",function(){e.CHM(i);const t=e.oxw();return e.KtG(t.login())}),e._uU(14,"Enter"),e.qZA()()()}if(2&o){const i=e.oxw();e.xp6(6),e.E3D("ngModel",i.housename),e.xp6(),e.Q6J("ngForOf",e.lcZ(8,3,i.houseNames$)),e.xp6(4),e.E3D("ngModel",i.staffID)}}function L(o,s){if(1&o){const i=e.EpF();e.TgZ(0,"ion-card",14)(1,"ion-card-subtitle",14)(2,"i"),e._uU(3,"Enter a valid email address and then your password you recevied from HOM staff."),e._UZ(4,"br"),e._uU(5," If you don't not have an HOM provided password please contact the Help Desk at the HOM office."),e.qZA()(),e.TgZ(6,"ion-card-content")(7,"ion-item")(8,"ion-input",20),e.Uc_("ngModelChange",function(t){e.CHM(i);const a=e.oxw();return e.nJJ(a.email,t)||(a.email=t),e.KtG(t)}),e.qZA()(),e._UZ(9,"br"),e.TgZ(10,"ion-item")(11,"ion-input",21),e.Uc_("ngModelChange",function(t){e.CHM(i);const a=e.oxw();return e.nJJ(a.password,t)||(a.password=t),e.KtG(t)}),e.qZA(),e.TgZ(12,"ion-icon",22),e.NdJ("click",function(){e.CHM(i);const t=e.oxw();return e.KtG(t.showPassword=!t.showPassword)}),e.qZA()(),e._UZ(13,"br"),e.TgZ(14,"ion-button",18),e.NdJ("click",function(){e.CHM(i);const t=e.oxw();return e.KtG(t.loginPP())}),e._uU(15,"Enter"),e.qZA()()()}if(2&o){const i=e.oxw();e.xp6(8),e.E3D("ngModel",i.email),e.xp6(3),e.E3D("ngModel",i.password),e.Q6J("type",i.showPassword?"text":"password")}}const y=[{path:"",component:(()=>{var o;class s{selectUserType(n){this.userType=n}constructor(n,t){this.router=n,this.quickbaseService=t,this.houseNames=[],this.housename="",this.staffID="",this.HLphone="",this.maxMeetingDate="",this.errorMessage="",this.recordNumber=0,this.savedRecordNumber=0,this.userType="",this.email="",this.password="",this.showPassword=!1,this.houseNames$=this.quickbaseService.getHouseNames().pipe((0,P.b)(a=>console.log("API response:",a)),(0,b.U)(a=>a))}navigateToHelpDesk(){this.router.navigate(["/help-desk"])}ngOnInit(){this.quickbaseService.errorMessage$.subscribe(n=>{this.errorMessage=n})}login(){console.log("Housename:",this.housename),console.log("StaffID:",this.staffID),console.log("HLphone:",this.HLphone),console.log("MaxMeetingDate:",this.maxMeetingDate),this.quickbaseService.query(this.housename,this.staffID).subscribe(n=>{if(n){var t,a,p,_;const h=null===(t=n.theHouseName)||void 0===t?void 0:t.value,x=null===(a=n.HouseLeaderName)||void 0===a?void 0:a.value,M=null===(p=n.HLphone)||void 0===p?void 0:p.value;this.recordNumber=n.recordNumber,this.savedRecordNumber=this.recordNumber,this.maxMeetingDate=null===(_=n.maxMeetingDate)||void 0===_?void 0:_.value,console.log("Record number after setting:",this.savedRecordNumber),this.quickbaseService.queryData=n,console.log("Query data:",this.quickbaseService.queryData),this.quickbaseService.getResidents(this.savedRecordNumber).subscribe(l=>{console.log("savedRecord number:",this.savedRecordNumber),this.quickbaseService.residentData.next(l),console.log("Resident data:",l)}),this.quickbaseService.getPendingArrivals(this.savedRecordNumber).subscribe(l=>{console.log("Pending arrivals data:",l),this.quickbaseService.pendingArrivals.next(l)}),h&&x&&M&&this.quickbaseService.getMaxMeetingDate(h).subscribe(l=>{var f;this.maxMeetingDate=null===(f=l.data[0])||void 0===f?void 0:f[40].value,console.log("MaxMeetingDate:",this.maxMeetingDate),this.router.navigate(["/home",{theHouseName:h,HouseLeaderName:x,HLphone:M,maxMeetingDate:this.maxMeetingDate}])})}else console.error("No data found in the response")},n=>{console.error("API Error:",n)})}loginPP(){/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/.test(this.email)?this.router.navigate(["/resident-info"]):alert("Please enter a valid email address")}}return(o=s).\u0275fac=function(n){return new(n||o)(e.Y36(u.F0),e.Y36(v.x))},o.\u0275cmp=e.Xpm({type:o,selectors:[["app-login"]],decls:27,vars:9,consts:[[3,"translucent"],["color","Primary"],[3,"fullscreen"],[1,"logo-container"],["src","assets/logo/HOM.png","alt","Logo"],["class","error-message",4,"ngIf"],[1,"login-cards"],[1,"ion-text-center",3,"click"],["src","assets/logo/Participants.png","alt","Logo"],["src","assets/logo/House Leader.png","alt","Logo"],["class","ion-text-center",4,"ngIf"],[1,"wrapper"],[1,"ion-activatable","ripple-parent","rounded-rectangle","ripple-effect-blue",3,"click"],[1,"error-message"],[1,"ion-text-center"],["label","House Name: ",3,"ngModel","ngModelChange"],[3,"value",4,"ngFor","ngForOf"],["type","text","placeholder","StaffID",1,"ion-text-center",3,"ngModel","ngModelChange"],[3,"click"],[3,"value"],["type","email","placeholder","Participant's Email Address",3,"ngModel","ngModelChange"],["type","password","placeholder","HOM Provided Password",3,"ngModel","type","ngModelChange"],["slot","end","name","eye",3,"click"]],template:function(n,t){1&n&&(e.TgZ(0,"ion-header",0)(1,"ion-toolbar")(2,"ion-title",1),e._uU(3," HOM Mobile Assistant "),e.qZA()()(),e.TgZ(4,"ion-content",2)(5,"div",3),e._UZ(6,"img",4),e.qZA(),e.TgZ(7,"ion-card-header")(8,"ion-card-title"),e._uU(9,"Tap on your role below to get started."),e.qZA(),e.YNc(10,Z,2,1,"div",5),e.qZA(),e.TgZ(11,"div",6)(12,"ion-card",7),e.NdJ("click",function(){return t.selectUserType("PP")}),e._UZ(13,"img",8),e.TgZ(14,"ion-card-title"),e._uU(15,"Program Participant Login"),e.qZA()(),e.TgZ(16,"ion-card",7),e.NdJ("click",function(){return t.selectUserType("HL")}),e._UZ(17,"img",9),e.TgZ(18,"ion-card-title"),e._uU(19,"House Leader Login"),e.qZA()()(),e.YNc(20,C,15,5,"ion-card",10)(21,L,16,3,"ion-card",10),e.TgZ(22,"div",11),e._UZ(23,"br"),e.TgZ(24,"div",12),e.NdJ("click",function(){return t.navigateToHelpDesk()}),e._uU(25," Submit Help Desk Ticket "),e._UZ(26,"ion-ripple-effect"),e.qZA()()()),2&n&&(e.Q6J("translucent",!0),e.xp6(4),e.Q6J("fullscreen",!0),e.xp6(6),e.Q6J("ngIf",t.errorMessage),e.xp6(2),e.ekj("selected","PP"===t.userType),e.xp6(4),e.ekj("selected","HL"===t.userType),e.xp6(4),e.Q6J("ngIf","HL"===t.userType),e.xp6(),e.Q6J("ngIf","PP"===t.userType))},dependencies:[g.sg,g.O5,d.JJ,d.On,r.YG,r.PM,r.FN,r.Zi,r.tO,r.Dq,r.W2,r.Gu,r.gu,r.pK,r.Ie,r.H$,r.t9,r.n0,r.wd,r.sr,r.QI,r.j9,g.Ov],styles:["ion-header[_ngcontent-%COMP%]{--ion-background-color: #4194ab !important;--ion-color-base: #fff !important}ion-card-title[_ngcontent-%COMP%]{text-align:center;font-size:22px}.error-message[_ngcontent-%COMP%]{color:red;font-size:20px;margin-top:10px}ion-button[_ngcontent-%COMP%]{--padding-start: 40px;--padding-end: 40px;--padding-top: 10px;--padding-bottom: 10px;--background: #4194ab;--color: #fff;--border-radius: 10px;font-size:18px;font-weight:bolder;position:relative;z-index:1}ion-card-subtitle.ion-text-center[_ngcontent-%COMP%]{font-size:14px;padding-left:50px;padding-right:50px;padding-top:10px}.logo-container[_ngcontent-%COMP%]{text-align:center;margin-left:15px;margin-top:10px;margin-bottom:10px}.login-cards[_ngcontent-%COMP%]   ion-card[_ngcontent-%COMP%]   ion-card-title[_ngcontent-%COMP%]{font-size:12px;text-align:center}.login-cards[_ngcontent-%COMP%]{display:flex;justify-content:space-around;margin-bottom:20px}.login-cards[_ngcontent-%COMP%]   ion-card[_ngcontent-%COMP%]{flex:1;max-width:100px;margin:5px;cursor:pointer}.login-cards[_ngcontent-%COMP%]   ion-card.selected[_ngcontent-%COMP%]{background-color:#4194ab;border-top:2px solid #4194ab;border-bottom:2px solid #4194ab;border-left:2px solid #4194ab;border-right:2px solid #4194ab}.login-cards[_ngcontent-%COMP%]   ion-card.selected[_ngcontent-%COMP%]   ion-card-title[_ngcontent-%COMP%]{color:#fff!important;font-size:14px;font-weight:700}.ripple-effect-blue[_ngcontent-%COMP%]{color:#010384}.ripple-effect-lightblue[_ngcontent-%COMP%]{color:#00c8ff}.ripple-effect-red[_ngcontent-%COMP%]{color:#980707}.wrapper[_ngcontent-%COMP%]{position:fixed;bottom:5;left:0;right:0;display:flex;align-items:center;justify-content:center;text-align:center;font-size:small;height:50px}b[_ngcontent-%COMP%]{width:100%}.ripple-parent[_ngcontent-%COMP%]{display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;border:1px solid #4194ab;width:100%;height:50px;border-radius:8px}.rounded-rectangle[_ngcontent-%COMP%]{width:200px;height:20px;border-radius:8px}"]}),s})()}];let O=(()=>{var o;class s{}return(o=s).\u0275fac=function(n){return new(n||o)},o.\u0275mod=e.oAB({type:o}),o.\u0275inj=e.cJS({imports:[u.Bz.forChild(y),u.Bz]}),s})(),k=(()=>{var o;class s{}return(o=s).\u0275fac=function(n){return new(n||o)},o.\u0275mod=e.oAB({type:o}),o.\u0275inj=e.cJS({imports:[g.ez,d.u5,r.Pc,O]}),s})()}}]);