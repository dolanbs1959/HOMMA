"use strict";(self.webpackChunkapp=self.webpackChunkapp||[]).push([[3687],{3687:(q,_,c)=>{c.r(_),c.d(_,{LoginPageModule:()=>J});var p=c(6814),h=c(95),a=c(849),f=c(4408),M=c(9397),P=c(7398),e=c(9212),b=c(6311),y=c(1351),Z=c(3076),C=c(9862);function T(o,s){if(1&o&&(e.TgZ(0,"div",16),e._uU(1),e.qZA()),2&o){const i=e.oxw();e.xp6(),e.hij(" ",i.errorMessage," ")}}function L(o,s){if(1&o&&(e.TgZ(0,"ion-select-option",22),e._uU(1),e.qZA()),2&o){const i=s.$implicit;e.Q6J("value",i),e.xp6(),e.hij(" ",i," ")}}function O(o,s){if(1&o){const i=e.EpF();e.TgZ(0,"ion-card",17)(1,"ion-card-subtitle",17)(2,"i"),e._uU(3,"Enter your credentials and tap the blue button to enter."),e.qZA()(),e.TgZ(4,"ion-card-content")(5,"ion-item")(6,"ion-select",18),e.Uc_("ngModelChange",function(t){e.CHM(i);const r=e.oxw();return e.nJJ(r.housename,t)||(r.housename=t),e.KtG(t)}),e.YNc(7,L,2,2,"ion-select-option",19),e.ALo(8,"async"),e.qZA()(),e._UZ(9,"br"),e.TgZ(10,"ion-item")(11,"ion-input",20),e.Uc_("ngModelChange",function(t){e.CHM(i);const r=e.oxw();return e.nJJ(r.staffID,t)||(r.staffID=t),e.KtG(t)}),e.qZA()(),e._UZ(12,"br"),e.TgZ(13,"ion-button",21),e.NdJ("click",function(){e.CHM(i);const t=e.oxw();return e.KtG(t.login())}),e._uU(14,"Enter"),e.qZA()()()}if(2&o){const i=e.oxw();e.xp6(6),e.E3D("ngModel",i.housename),e.xp6(),e.Q6J("ngForOf",e.lcZ(8,3,i.houseNames$)),e.xp6(4),e.E3D("ngModel",i.staffID)}}function w(o,s){if(1&o){const i=e.EpF();e.TgZ(0,"ion-card",17)(1,"ion-card-subtitle",17)(2,"i"),e._uU(3,"Enter a valid email address and then your password you recevied from HOM staff."),e._UZ(4,"br"),e._uU(5," If you don't not have an HOM provided password you can request it from your Care Navigator."),e.qZA()(),e.TgZ(6,"ion-card-content")(7,"ion-item")(8,"ion-input",23),e.Uc_("ngModelChange",function(t){e.CHM(i);const r=e.oxw();return e.nJJ(r.email,t)||(r.email=t),e.KtG(t)}),e.qZA()(),e._UZ(9,"br"),e.TgZ(10,"ion-item")(11,"ion-input",24),e.Uc_("ngModelChange",function(t){e.CHM(i);const r=e.oxw();return e.nJJ(r.password,t)||(r.password=t),e.KtG(t)}),e.qZA(),e.TgZ(12,"ion-icon",25),e.NdJ("click",function(){e.CHM(i);const t=e.oxw();return e.KtG(t.showPassword=!t.showPassword)}),e.qZA()(),e._UZ(13,"br"),e.TgZ(14,"ion-button",21),e.NdJ("click",function(){e.CHM(i);const t=e.oxw();return e.KtG(t.loginPP())}),e._uU(15,"Enter"),e.qZA()()()}if(2&o){const i=e.oxw();e.xp6(8),e.E3D("ngModel",i.email),e.xp6(3),e.E3D("ngModel",i.password),e.Q6J("type",i.showPassword?"text":"password")}}function U(o,s){if(1&o&&(e.TgZ(0,"div",26),e._UZ(1,"p",27),e.qZA()),2&o){const i=e.oxw();e.xp6(),e.Q6J("innerHTML",i.dailyVerse,e.oJD)}}const A=[{path:"",component:(()=>{var o;class s{selectUserType(n){this.userType=n}constructor(n,t,r,l,d){this.router=n,this.quickbaseService=t,this.ResidentInfoService=r,this.userService=l,this.http=d,this.houseNames=[],this.housename="",this.staffID="",this.HLphone="",this.maxMeetingDate="",this.errorMessage="",this.recordNumber=0,this.savedRecordNumber=0,this.userType="",this.email="",this.password="",this.showPassword=!1,this.isDisabled=!0,this.dailyVerse="",this.staticVerse="For I was an hungred, and ye gave me meat: I was thirsty, and ye gave me drink: I was a stranger, and ye took me in. Matthew 25:35, KJV",this.houseNames$=this.quickbaseService.getHouseNames().pipe((0,M.b)(g=>console.log("API response:",g)),(0,P.U)(g=>g))}fetchRandomVerse(){this.http.get("https://bible-api.com/data/kjv/random/MAT,MRK,LUK,JHN").subscribe(n=>{const{text:t,book_id:r,chapter:l,verse:d}=n.random_verse;this.dailyVerse=`${t.trim()} ${r} ${l}:${d} ${name}`},n=>{console.error("Error fetching Bible verse:",n),this.dailyVerse="Failed to load daily verse."})}navigateToHelpDesk(){this.router.navigate(["/help-desk"])}onLogin(){this.userService.setUserInfo(this.housename,this.staffID),this.router.navigate(["/home"])}ngOnInit(){this.quickbaseService.errorMessage$.subscribe(n=>{this.errorMessage=n}),this.fetchRandomVerse()}login(){console.log("Housename:",this.housename),console.log("StaffID:",this.staffID),console.log("HLphone:",this.HLphone),console.log("MaxMeetingDate:",this.maxMeetingDate),this.quickbaseService.query(this.housename,this.staffID).subscribe(n=>{if(n){var t,r,l,d;const g=null===(t=n.theHouseName)||void 0===t?void 0:t.value,x=null===(r=n.HouseLeaderName)||void 0===r?void 0:r.value,v=null===(l=n.HLphone)||void 0===l?void 0:l.value;this.recordNumber=n.recordNumber,this.savedRecordNumber=this.recordNumber,this.maxMeetingDate=null===(d=n.maxMeetingDate)||void 0===d?void 0:d.value,console.log("Record number after setting:",this.savedRecordNumber),this.quickbaseService.queryData=n,console.log("Query data:",this.quickbaseService.queryData),this.quickbaseService.getResidents(this.savedRecordNumber).subscribe(u=>{console.log("savedRecord number:",this.savedRecordNumber),this.quickbaseService.residentData.next(u),console.log("Resident data:",u)}),this.quickbaseService.getPendingArrivals(this.savedRecordNumber).subscribe(u=>{console.log("Pending arrivals data:",u),this.quickbaseService.pendingArrivals.next(u)}),g&&x&&v&&this.quickbaseService.getMaxMeetingDate(g).subscribe(u=>{var m;this.maxMeetingDate=null===(m=u.data[0])||void 0===m?void 0:m[40].value,console.log("MaxMeetingDate:",this.maxMeetingDate),this.router.navigate(["/home",{theHouseName:g,HouseLeaderName:x,HLphone:v,maxMeetingDate:this.maxMeetingDate}])})}else console.error("No data found in the response")},n=>{console.error("API Error:",n)})}loginPP(){/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/.test(this.email)?this.ResidentInfoService.queryPP(this.email,this.password).subscribe(t=>{this.ResidentInfoService.setLoginResponse(t),this.router.navigate(["/resident-info"])},t=>{console.error("Error:",t)}):alert("Please enter a valid email address")}}return(o=s).\u0275fac=function(n){return new(n||o)(e.Y36(f.F0),e.Y36(b.x),e.Y36(y.d),e.Y36(Z.K),e.Y36(C.eN))},o.\u0275cmp=e.Xpm({type:o,selectors:[["app-login"]],decls:33,vars:11,consts:[[3,"translucent"],["color","Primary"],[3,"fullscreen"],[1,"logo-container"],["src","assets/logo/HOM3.png","alt","Logo"],[1,"static-verse-container"],[1,"static-verse-text"],["class","error-message",4,"ngIf"],[1,"login-cards"],[1,"ion-text-center",3,"click"],["src","assets/logo/Participants.png","alt","Logo"],["src","assets/logo/House Leader.png","alt","Logo"],["class","ion-text-center",4,"ngIf"],[1,"verse-card"],["class","daily-verse",4,"ngIf"],[1,"wrapper"],[1,"error-message"],[1,"ion-text-center"],["label","House Name: ",3,"ngModel","ngModelChange"],[3,"value",4,"ngFor","ngForOf"],["type","text","placeholder","StaffID",1,"ion-text-center",3,"ngModel","ngModelChange"],[3,"click"],[3,"value"],["type","email","placeholder","Participant's Email Address",3,"ngModel","ngModelChange"],["type","password","placeholder","HOM Provided Password",3,"ngModel","type","ngModelChange"],["slot","end","name","eye",3,"click"],[1,"daily-verse"],[1,"verse-text",3,"innerHTML"]],template:function(n,t){1&n&&(e.TgZ(0,"ion-header",0)(1,"ion-toolbar")(2,"ion-title",1),e._uU(3," HOM Mobile Assistant "),e.qZA()()(),e.TgZ(4,"ion-content",2)(5,"div",3),e._UZ(6,"img",4),e.qZA(),e.TgZ(7,"div",5)(8,"p",6),e._uU(9),e.qZA()(),e.TgZ(10,"ion-card-header")(11,"ion-card-title"),e._uU(12,"Tap on your role below to get started."),e.qZA(),e.YNc(13,T,2,1,"div",7),e.qZA(),e.TgZ(14,"div",8)(15,"ion-card",9),e.NdJ("click",function(){return t.selectUserType("PP")}),e._UZ(16,"img",10),e.TgZ(17,"ion-card-title"),e._uU(18,"Program Participant Login"),e.qZA()(),e.TgZ(19,"ion-card",9),e.NdJ("click",function(){return t.selectUserType("HL")}),e._UZ(20,"img",11),e.TgZ(21,"ion-card-title"),e._uU(22,"House Leader Login"),e.qZA()()(),e.YNc(23,O,15,5,"ion-card",12)(24,w,16,3,"ion-card",12),e.TgZ(25,"ion-card",13)(26,"ion-card-content")(27,"p")(28,"b"),e._uU(29,"A random verse from the Gospels (KJV):"),e.qZA()(),e.YNc(30,U,2,1,"div",14),e.qZA()(),e.TgZ(31,"div",15),e._UZ(32,"br"),e.qZA()()),2&n&&(e.Q6J("translucent",!0),e.xp6(4),e.Q6J("fullscreen",!0),e.xp6(5),e.Oqu(t.staticVerse),e.xp6(4),e.Q6J("ngIf",t.errorMessage),e.xp6(2),e.ekj("selected","PP"===t.userType),e.xp6(4),e.ekj("selected","HL"===t.userType),e.xp6(4),e.Q6J("ngIf","HL"===t.userType),e.xp6(),e.Q6J("ngIf","PP"===t.userType),e.xp6(6),e.Q6J("ngIf",t.dailyVerse))},dependencies:[p.sg,p.O5,h.JJ,h.On,a.YG,a.PM,a.FN,a.Zi,a.tO,a.Dq,a.W2,a.Gu,a.gu,a.pK,a.Ie,a.t9,a.n0,a.wd,a.sr,a.QI,a.j9,p.Ov],styles:["ion-header[_ngcontent-%COMP%]{--ion-background-color: #4194ab !important;--ion-color-base: #fff !important}ion-card-title[_ngcontent-%COMP%]{text-align:center;font-size:22px}.error-message[_ngcontent-%COMP%]{color:red;font-size:20px;margin-top:10px}ion-button[_ngcontent-%COMP%]{--padding-start: 40px;--padding-end: 40px;--padding-top: 10px;--padding-bottom: 10px;--background: #4194ab;--color: #fff;--border-radius: 10px;font-size:18px;font-weight:bolder;position:relative;z-index:1}.disabled[_ngcontent-%COMP%]{pointer-events:none;opacity:.5}ion-card-subtitle.ion-text-center[_ngcontent-%COMP%]{font-size:14px;padding-left:50px;padding-right:50px;padding-top:10px}.logo-container[_ngcontent-%COMP%]{text-align:center;margin-left:15px;margin-top:10px;margin-bottom:0}.login-cards[_ngcontent-%COMP%]   ion-card[_ngcontent-%COMP%]   ion-card-title[_ngcontent-%COMP%]{font-size:12px;text-align:center}.login-cards[_ngcontent-%COMP%]{display:flex;justify-content:space-around;margin-bottom:20px}.login-cards[_ngcontent-%COMP%]   ion-card[_ngcontent-%COMP%]{flex:1;max-width:100px;margin:5px;cursor:pointer}.login-cards[_ngcontent-%COMP%]   ion-card.selected[_ngcontent-%COMP%]{background-color:#4194ab;border-top:2px solid #4194ab;border-bottom:2px solid #4194ab;border-left:2px solid #4194ab;border-right:2px solid #4194ab}.login-cards[_ngcontent-%COMP%]   ion-card.selected[_ngcontent-%COMP%]   ion-card-title[_ngcontent-%COMP%]{color:#fff!important;font-size:14px;font-weight:700}.ripple-effect-blue[_ngcontent-%COMP%]{color:#010384}.ripple-effect-lightblue[_ngcontent-%COMP%]{color:#00c8ff}.ripple-effect-red[_ngcontent-%COMP%]{color:#980707}.wrapper[_ngcontent-%COMP%]{position:fixed;bottom:5;left:0;right:0;display:flex;align-items:center;justify-content:center;text-align:center;font-size:small;height:50px}b[_ngcontent-%COMP%]{width:100%}.ripple-parent[_ngcontent-%COMP%]{display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;border:1px solid #4194ab;width:100%;height:50px;border-radius:8px}.rounded-rectangle[_ngcontent-%COMP%]{width:200px;height:20px;border-radius:8px}.verse-card[_ngcontent-%COMP%]{margin:20px;padding:10px;border:2px solid #ff6666;border-radius:8px;box-shadow:0 2px 4px #0000001a}.verse-text[_ngcontent-%COMP%]{color:#f66;font-style:italic;font-size:.9em}.static-verse-container[_ngcontent-%COMP%]{text-align:center;margin:5px 5}.static-verse-text[_ngcontent-%COMP%]{color:#151212;font-style:italic;font-size:.7em;padding:0 16px}"]}),s})()}];let N=(()=>{var o;class s{}return(o=s).\u0275fac=function(n){return new(n||o)},o.\u0275mod=e.oAB({type:o}),o.\u0275inj=e.cJS({imports:[f.Bz.forChild(A),f.Bz]}),s})(),J=(()=>{var o;class s{}return(o=s).\u0275fac=function(n){return new(n||o)},o.\u0275mod=e.oAB({type:o}),o.\u0275inj=e.cJS({imports:[p.ez,h.u5,a.Pc,N]}),s})()}}]);