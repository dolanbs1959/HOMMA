"use strict";(self.webpackChunkapp=self.webpackChunkapp||[]).push([[1825],{1825:(Q,_,l)=>{l.r(_),l.d(_,{HomePageModule:()=>S});var c=l(6814),r=l(849),b=l(95),u=l(4408),e=l(9212),v=l(6311),Z=l(2496);function C(n,s){if(1&n&&e._UZ(0,"img",15),2&n){const a=e.oxw().$implicit;e.Q6J("src",a.residentPhoto,e.LSH)}}function x(n,s){if(1&n){const a=e.EpF();e.TgZ(0,"ion-card")(1,"ion-card-content")(2,"a",13),e.NdJ("click",function(){const o=e.CHM(a).$implicit,d=e.oxw();return e.KtG(d.navigateToDetail(o.recordNumber2.value,!1))}),e.YNc(3,C,1,1,"img",14),e.TgZ(4,"p"),e._uU(5),e.qZA()()()()}if(2&n){const a=s.$implicit;e.xp6(3),e.Q6J("ngIf",a.residentPhoto),e.xp6(2),e.Oqu(a.residentFullName.value)}}function M(n,s){1&n&&(e.TgZ(0,"ion-card-title",3),e._uU(1,"Pending New Arrivals"),e.qZA())}function A(n,s){if(1&n){const a=e.EpF();e.TgZ(0,"ion-card")(1,"ion-card-content")(2,"a",13),e.NdJ("click",function(){const o=e.CHM(a).$implicit,d=e.oxw();return e.KtG(d.navigateToDetail(o.recordNumber2.value,!0))}),e._UZ(3,"div",16),e.ALo(4,"date"),e.qZA()()()}if(2&n){const a=s.$implicit;e.xp6(3),e.Q6J("innerHTML",a.residentFullName.value+" - Age: "+a.residentAge.value+" - Level: "+a.SOLevel.value+" - PRD: "+(a.PRD.value?e.xi3(4,1,a.PRD.value,"MM-dd-yyyy"):"TBD"),e.oJD)}}const f=n=>({"background-color":n,color:"white"});let O=(()=>{var n;class s{constructor(i,t,o){this.quickbaseService=i,this.route=t,this.router=o,this.HouseLeaderName="",this.theHouseName="",this.HLphone="",this.residentPhoto="",this.residentFullName="",this.savedRecordNumber=0,this.weeklyHouseMeeting="",this.maxMeetingDate="",this.STAalert="",this.Alert="",this.residentData=[],this.pendingArrivals=[],this.quickbaseService.residentData.subscribe(d=>{this.residentData=d,console.log("Updated resident data:",this.residentData)}),this.quickbaseService.pendingArrivals.subscribe(d=>{this.pendingArrivals=d,console.log("Constructor Pending Arrivals:",this.pendingArrivals)}),this.STAalert=this.quickbaseService.STAalert,this.Alert=this.quickbaseService.Alert}openStaffTasks(){this.quickbaseService.getStaffTasks().subscribe(i=>{const t=i.data.map(o=>({id:o[3].value,taskName:o[8].value,priority:o[15].value,status:o[22].value,role:o[32].value,houseName:o[36].value,frequency:o[47].value,p1on1sDue:o[263].value}));console.log("Transformed tasks:",t),this.router.navigate(["/staff-tasks"],{state:{tasks:t,theHouseName:this.theHouseName,HouseLeaderName:this.HouseLeaderName,HLphone:this.HLphone,maxMeetingDate:this.maxMeetingDate}})})}exitApp(){this.router.navigate(["/login"])}ngOnInit(){this.residentData=this.quickbaseService.residentData,this.pendingArrivals=this.quickbaseService.pendingArrivals,this.route.params.subscribe(i=>{console.log("Route params:",i),this.theHouseName=i.theHouseName,this.HouseLeaderName=i.HouseLeaderName,this.HLphone=i.HLphone,this.maxMeetingDate=i.maxMeetingDate})}navigateToDetail(i,t){t?this.router.navigate(["/resident-update",i]):this.router.navigate(["/home/resident-detail",i],{queryParams:{residentPhoto:this.residentPhoto,theHouseName:this.theHouseName,houseLeaderName:this.HouseLeaderName}})}}return(n=s).\u0275fac=function(i){return new(i||n)(e.Y36(v.x),e.Y36(u.gz),e.Y36(u.F0))},n.\u0275cmp=e.Xpm({type:n,selectors:[["app-home"]],decls:44,vars:26,consts:[[3,"translucent"],["color","Primary"],[3,"fullscreen"],[1,"ion-text-center"],["src","assets/logo/HOM3.png","alt","Logo"],[1,"ion-text-left"],[1,"alert-format",3,"ngStyle"],[1,"wrapper"],[1,"ion-activatable","ripple-parent","rounded-rectangle","ripple-effect-lightblue",3,"click"],[1,"body-text"],[4,"ngFor","ngForOf"],["class","ion-text-center",4,"ngIf"],[1,"ion-activatable","ripple-parent","rounded-rectangle","ripple-effect-red",3,"click"],[3,"click"],["alt","Resident Photo","class","thumbnail",3,"src",4,"ngIf"],["alt","Resident Photo",1,"thumbnail",3,"src"],[3,"innerHTML"]],template:function(i,t){if(1&i&&(e.TgZ(0,"ion-header",0)(1,"ion-toolbar")(2,"ion-title",1),e._uU(3," HOM Mobile Assistant - Participants "),e.qZA()()(),e.TgZ(4,"ion-content",2)(5,"ion-card",3),e._UZ(6,"img",4)(7,"br"),e.TgZ(8,"ion-card-header")(9,"ion-card-title",3),e._uU(10),e.qZA(),e.TgZ(11,"ion-card-subtitle",5),e._uU(12),e._UZ(13,"br"),e._uU(14),e._UZ(15,"br"),e.qZA()()(),e.TgZ(16,"div",6)(17,"p",3),e._uU(18),e.ALo(19,"extractText"),e.qZA()(),e.TgZ(20,"div",6)(21,"p",3),e._uU(22),e.ALo(23,"extractText"),e.qZA()(),e.TgZ(24,"div",7)(25,"div",8),e.NdJ("click",function(){return t.openStaffTasks()}),e._uU(26," Manage House Leader Tasks "),e._UZ(27,"ion-ripple-effect"),e.qZA(),e.TgZ(28,"div",9),e._uU(29,"Click on a resident below to view their details, add an Observation Report or Resident Update"),e.qZA()(),e.TgZ(30,"ion-card-title",3),e._uU(31,"Active Participants"),e.qZA(),e.YNc(32,x,6,2,"ion-card",10),e.ALo(33,"async"),e._UZ(34,"router-outlet"),e.YNc(35,M,2,0,"ion-card-title",11),e.ALo(36,"async"),e.YNc(37,A,5,4,"ion-card",10),e.ALo(38,"async"),e.TgZ(39,"div",7),e._UZ(40,"br"),e.TgZ(41,"div",12),e.NdJ("click",function(){return t.exitApp()}),e._uU(42," Return to Login Page "),e._UZ(43,"ion-ripple-effect"),e.qZA()()()),2&i){let o;e.Q6J("translucent",!0),e.xp6(4),e.Q6J("fullscreen",!0),e.xp6(6),e.Oqu(t.theHouseName),e.xp6(2),e.hij("House Leader: ",t.HouseLeaderName,""),e.xp6(2),e.hij(" Phone: ",t.HLphone,""),e.xp6(2),e.Q6J("ngStyle",e.VKq(22,f,"No Alerts"==t.STAalert?"green":"red")),e.xp6(2),e.Oqu(e.lcZ(19,12,t.STAalert)),e.xp6(2),e.Q6J("ngStyle",e.VKq(24,f,t.Alert.includes("No Alerts")?"green":"red")),e.xp6(2),e.Oqu(e.lcZ(23,14,t.Alert)),e.xp6(10),e.Q6J("ngForOf",e.lcZ(33,16,t.quickbaseService.residentData)),e.xp6(3),e.Q6J("ngIf",(null==(o=e.lcZ(36,18,t.quickbaseService.pendingArrivals))?null:o.length)>0),e.xp6(2),e.Q6J("ngForOf",e.lcZ(38,20,t.quickbaseService.pendingArrivals))}},dependencies:[c.sg,c.O5,c.PC,r.PM,r.FN,r.Zi,r.tO,r.Dq,r.W2,r.Gu,r.H$,r.wd,r.sr,u.lC,c.Ov,c.uU,Z.d],styles:["#container[_ngcontent-%COMP%]{text-align:center;position:absolute;left:0;right:0;top:50%;transform:translateY(-50%)}.body-text[_ngcontent-%COMP%]{font-size:12px;line-height:16px;margin-top:0}#container[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%]{font-size:14px;line-height:18px}.fields-container[_ngcontent-%COMP%]{display:flex;justify-content:space-evenly}#container[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]{font-size:12px;line-height:16px;color:#2b9c4d;margin:0}.thumbnail[_ngcontent-%COMP%]{width:100px;height:130px;object-fit:cover}.info-container[_ngcontent-%COMP%]{display:flex;justify-content:space-between}.info-item[_ngcontent-%COMP%]{margin:0}#container[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]{text-decoration:none}ion-header[_ngcontent-%COMP%]{--ion-background-color: #4194ab !important;--ion-color-base: #fff !important}ion-title[_ngcontent-%COMP%]{font-size:1.1em;font-weight:400;text-shadow:none}.alert-format[_ngcontent-%COMP%]{font-size:12px;font-weight:700;color:#fa071b;margin:20px 40px 0;line-height:20px}.weekly-meeting-message[_ngcontent-%COMP%]   ion-card-subtitle[_ngcontent-%COMP%]{text-align:center;font-size:12px;color:#010384;font-weight:700}ion-content[_ngcontent-%COMP%]{--ion-font-size: 12px}ion-buttons[_ngcontent-%COMP%]{font-size:1.1em}.ripple-effect-blue[_ngcontent-%COMP%]{color:#010384}.ripple-effect-lightblue[_ngcontent-%COMP%]{color:#00c8ff}.ripple-effect-red[_ngcontent-%COMP%]{color:#980707}.wrapper[_ngcontent-%COMP%]{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;text-align:center;height:100px;width:300px;margin:0 auto}b[_ngcontent-%COMP%]{width:100%}.ripple-parent[_ngcontent-%COMP%]{display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;border:1px solid #4194ab;width:100%;height:50px;border-radius:8px}.rounded-rectangle[_ngcontent-%COMP%]{width:300px;height:50px;border-radius:8px}"]}),s})();var N=l(9353),T=l(6593),U=l(491),H=l(9669);function k(n,s){if(1&n&&e._UZ(0,"img",18),2&n){const a=e.oxw(2);e.Q6J("src",a.residentData.residentPhoto,e.LSH)}}function y(n,s){if(1&n){const a=e.EpF();e.TgZ(0,"div")(1,"h1"),e._uU(2),e.qZA(),e._UZ(3,"br"),e.YNc(4,k,1,1,"img",16),e.TgZ(5,"ion-card-subtitle",17),e._uU(6),e.TgZ(7,"a",8),e.NdJ("click",function(){e.CHM(a);const t=e.oxw();return e.KtG(t.promptAction(t.residentData.CareMgrPhone.value,t.residentData.CareMgrName.value))}),e._uU(8),e.qZA()(),e.TgZ(9,"ion-card-subtitle",17),e._uU(10),e.TgZ(11,"a",8),e.NdJ("click",function(){e.CHM(a);const t=e.oxw();return e.KtG(t.promptAction(t.residentData.ProgMgrPhone.value,t.residentData.ProgMgrName.value))}),e._uU(12),e.qZA()(),e.TgZ(13,"ion-card-subtitle",17),e._uU(14),e.TgZ(15,"a",8),e.NdJ("click",function(){e.CHM(a);const t=e.oxw();return e.KtG(t.promptAction(t.residentData.ProgDirPhone.value,t.residentData.ProgDirName.value))}),e._uU(16),e.qZA()(),e._UZ(17,"br"),e.qZA()}if(2&n){const a=e.oxw();e.xp6(2),e.Oqu(a.residentData.residentFullName.value),e.xp6(2),e.Q6J("ngIf",a.residentData.residentPhoto),e.xp6(2),e.hij("Care Navigator: ",a.residentData.CareMgrName.value," "),e.xp6(2),e.Oqu(a.residentData.CareMgrPhone.value),e.xp6(2),e.hij("Program Manager: ",a.residentData.ProgMgrName.value," "),e.xp6(2),e.Oqu(a.residentData.ProgMgrPhone.value),e.xp6(2),e.hij("Program Director: ",a.residentData.ProgDirName.value," "),e.xp6(2),e.Oqu(a.residentData.ProgDirPhone.value)}}const q=[{path:"",component:O},{path:"resident-detail/:id",component:(()=>{var n;class s{constructor(i,t,o,d,p,g,h){this.router=i,this.location=t,this.route=o,this.sanitizer=d,this.dialog=p,this.photoStorageService=g,this.quickbaseService=h,this.theHouseName="",this.houseLeaderName="",this.quickbaseService.residentData.subscribe(m=>{this.residentData=m})}addParticipantReviews(){var i,t,o,d,p,g,h,m;if(!this.residentData)return void console.error("residentData is undefined");const P=(null===(i=this.residentData.residentFullName)||void 0===i?void 0:i.value)||"Unknown Participant",J=(null===(t=this.residentData.residentCCOlast)||void 0===t?void 0:t.value)||"CCO not listed",F=(null===(o=this.residentData.residentCCOphone)||void 0===o?void 0:o.value)||"No Phone Number",j=(null===(d=this.residentData.residentCCOmobile)||void 0===d?void 0:d.value)||"No Mobile Number",D=(null===(p=this.residentData.WorkStatus)||void 0===p?void 0:p.value)||"Unknown Work Status",$=(null===(g=this.residentData.residentEmail)||void 0===g?void 0:g.value)||"No Email",z=(null===(h=this.residentData.residentPhone)||void 0===h?void 0:h.value)||"No Phone",Y=(null===(m=this.residentData.recordNumber2)||void 0===m?void 0:m.value)||"No ID";P&&D?this.router.navigate(["/participant-reviews"],{queryParams:{ccoLastName:J,ccoPhoneNumber:F,ccoMobile:j,participantId:Y,participantName:P,participantEmail:$,participantPhone:z,residentPhoto:this.residentData.residentPhoto||"No Photo",workStatus:D,theHouseName:this.theHouseName,houseLeaderName:this.houseLeaderName}}):console.error("Critical properties are undefined or empty")}getSafeHtml(i){return this.sanitizer.bypassSecurityTrustHtml(i)}exitApp(){this.router.navigate(["/login"])}addObservationReport(){this.router.navigate(["/observation-report"],{state:{residentData:this.residentData}}),console.log("Resident Data:",this.residentData)}addResidentUpdate(){this.router.navigate(["/resident-update"],{state:{residentData:this.residentData}}),console.log("Resident detail data:",this.residentData)}promptAction(i,t){this.dialog.open(N.a,{data:{phoneNumber:i,name:t}})}goBack(){this.location.back()}ngOnInit(){const i=Number(this.route.snapshot.paramMap.get("id"));console.log("ID:",i),this.quickbaseService.residentData.subscribe(t=>{console.log("Data:",t),this.residentData=t.find(o=>o.recordNumber2.value===i),console.log("Resident Data:",this.residentData),this.residentData&&(this.residentPhoto=this.residentData.residentPhoto,console.log("Resident Photo:",this.residentPhoto))}),this.route.queryParams.subscribe(t=>{this.theHouseName=t.theHouseName||"",this.houseLeaderName=t.houseLeaderName||"",this.residentPhoto=t.residentPhoto||"",console.log("House Name:",this.theHouseName),console.log("House Leader Name:",this.houseLeaderName),console.log("Resident Photo:",this.residentPhoto)})}}return(n=s).\u0275fac=function(i){return new(i||n)(e.Y36(u.F0),e.Y36(c.Ye),e.Y36(u.gz),e.Y36(T.H7),e.Y36(U.uw),e.Y36(H.F),e.Y36(v.x))},n.\u0275cmp=e.Xpm({type:n,selectors:[["HOMMA-resident-detail"]],decls:87,vars:30,consts:[[3,"translucent"],["color","Primary"],[3,"fullscreen"],[1,"ion-text-center"],["src","assets/logo/HOM3.png","alt","Logo"],[4,"ngIf"],[1,"main",3,"fixed"],["size","6",1,"main"],[3,"click"],[1,"main"],[1,"main",2,"font-size","x-small"],[3,"innerHTML"],[1,"wrapper"],[1,"ion-activatable","ripple-parent","rounded-rectangle","ripple-effect-blue",3,"click"],[1,"ion-activatable","ripple-parent","rounded-rectangle","ripple-effect-green",3,"click"],[1,"ion-activatable","ripple-parent","rounded-rectangle","ripple-effect-red",3,"click"],["alt","Resident Photo","class","thumbnail",3,"src",4,"ngIf"],[1,"phone-link"],["alt","Resident Photo",1,"thumbnail",3,"src"]],template:function(i,t){1&i&&(e.TgZ(0,"ion-header",0)(1,"ion-toolbar")(2,"ion-title",1),e._uU(3," HOM Mobile Assistant - Participant Details "),e.qZA()()(),e.TgZ(4,"ion-content",2)(5,"ion-card",3),e._UZ(6,"img",4)(7,"br"),e.TgZ(8,"ion-card-header"),e.YNc(9,y,18,8,"div",5),e.qZA()(),e.TgZ(10,"ion-card")(11,"ion-card-header",3),e._uU(12),e.qZA(),e.TgZ(13,"ion-card-content")(14,"ion-grid",6)(15,"ion-row")(16,"ion-col",7),e._uU(17,"Participant Phone#: "),e.TgZ(18,"a",8),e.NdJ("click",function(){return t.promptAction(t.residentData.residentPhone.value,t.residentData.residentFullName.value)}),e._uU(19),e.qZA()(),e.TgZ(20,"ion-col",7),e._uU(21),e.ALo(22,"date"),e._UZ(23,"br"),e._uU(24),e.qZA()(),e.TgZ(25,"ion-row")(26,"ion-col",7),e._uU(27,"Bed Start Date:"),e._UZ(28,"br"),e._uU(29),e.ALo(30,"date"),e.qZA(),e.TgZ(31,"ion-col",7),e._uU(32),e.qZA()(),e.TgZ(33,"ion-row")(34,"ion-col",9),e._uU(35),e._UZ(36,"br"),e._uU(37),e.qZA(),e.TgZ(38,"ion-col",10),e._uU(39,"CCO Contact Info"),e._UZ(40,"br"),e._uU(41),e._UZ(42,"br"),e._uU(43,"Phone: "),e.TgZ(44,"a",8),e.NdJ("click",function(){return t.promptAction(t.residentData.residentCCOphone.value,t.residentData.residentCCOphone.value)}),e._uU(45),e.qZA(),e._UZ(46,"br"),e._uU(47,"Mobile: "),e.TgZ(48,"a",8),e.NdJ("click",function(){return t.promptAction(t.residentData.residentCCOmobile.value,t.residentData.residentCCOmobile.value)}),e._uU(49),e.qZA()()(),e.TgZ(50,"ion-row")(51,"ion-col",9),e._uU(52,"Fees Due First of Month:"),e._UZ(53,"br")(54,"div",11),e.qZA(),e.TgZ(55,"ion-col",9),e._uU(56),e.ALo(57,"currency"),e.qZA()(),e.TgZ(58,"ion-row")(59,"ion-col",9),e._uU(60,"Financial Status:"),e._UZ(61,"br")(62,"div",11),e.qZA(),e.TgZ(63,"ion-col",9),e._uU(64),e.qZA()()()()(),e.TgZ(65,"div",12)(66,"div",13),e.NdJ("click",function(){return t.addObservationReport()}),e._uU(67," Add Observation Report "),e._UZ(68,"ion-ripple-effect"),e.qZA(),e._UZ(69,"br"),e.TgZ(70,"div",14),e.NdJ("click",function(){return t.addResidentUpdate()}),e._uU(71," Add Resident Update "),e._UZ(72,"ion-ripple-effect"),e.qZA(),e._UZ(73,"br"),e.TgZ(74,"div",13),e.NdJ("click",function(){return t.addParticipantReviews()}),e._uU(75," Add Participant 1 on 1 "),e._UZ(76,"ion-ripple-effect"),e.qZA(),e._UZ(77,"br"),e.TgZ(78,"div",15),e.NdJ("click",function(){return t.goBack()}),e._uU(79," Return to Participant List "),e._UZ(80,"ion-ripple-effect"),e.qZA(),e._UZ(81,"br"),e.TgZ(82,"div",15),e.NdJ("click",function(){return t.exitApp()}),e._uU(83," Return to Login Page "),e._UZ(84,"ion-ripple-effect"),e.qZA(),e._UZ(85,"br")(86,"p"),e.qZA()()),2&i&&(e.Q6J("translucent",!0),e.xp6(4),e.Q6J("fullscreen",!0),e.xp6(5),e.Q6J("ngIf",t.residentData),e.xp6(3),e.hij(" Participant Status: ",t.residentData.ParticipantStatus.value,"\n"),e.xp6(2),e.Q6J("fixed",!0),e.xp6(5),e.Oqu(t.residentData.residentPhone.value),e.xp6(2),e.hij("Participant DOB: ",e.xi3(22,20,t.residentData.residentDOB.value,"MMM-dd-yyyy"),""),e.xp6(3),e.hij("Age: ",t.residentData.residentAge.value,""),e.xp6(5),e.hij(" ",e.xi3(30,23,null==t.residentData.residentBedStart?null:t.residentData.residentBedStart.value,"MMM-dd-yyyy"),""),e.xp6(3),e.hij("S/O Level: ",t.residentData.SOLevel.value,""),e.xp6(3),e.hij("Room #: ",t.residentData.Room.value,""),e.xp6(2),e.Oqu(t.residentData.Bed.value),e.xp6(4),e.AsE("Name: ",t.residentData.residentCCOfirst.value," ",t.residentData.residentCCOlast.value,""),e.xp6(4),e.Oqu(t.residentData.residentCCOphone.value),e.xp6(4),e.Oqu(t.residentData.residentCCOmobile.value),e.xp6(5),e.Q6J("innerHTML",t.getSafeHtml(null==t.residentData||null==t.residentData.FeesDueFirstofMonth?null:t.residentData.FeesDueFirstofMonth.value),e.oJD),e.xp6(2),e.hij("Past Due Fees: ",e.Dn7(57,26,null==t.residentData||null==t.residentData.PastDueFees?null:t.residentData.PastDueFees.value,"USD","symbol"),""),e.xp6(6),e.Q6J("innerHTML",t.getSafeHtml(null==t.residentData||null==t.residentData.FinancialStatus?null:t.residentData.FinancialStatus.value),e.oJD),e.xp6(2),e.hij("Active Payplans: ",t.residentData.ActivePayplans.value,""))},dependencies:[c.O5,r.PM,r.FN,r.Zi,r.tO,r.wI,r.W2,r.jY,r.Gu,r.H$,r.Nd,r.wd,r.sr,c.H9,c.uU],styles:["ion-header[_ngcontent-%COMP%]{--ion-background-color: #4194ab !important;--ion-color-base: #fff !important}ion-title[_ngcontent-%COMP%]{--ion-color-base: #fff !important;font-size:16px}ion-card-header[_ngcontent-%COMP%]{padding-bottom:0;font-weight:700}.thumbnail[_ngcontent-%COMP%]{width:100px;height:130px;object-fit:cover}ion-card-subtitle[_ngcontent-%COMP%]{--ion-color-base: #fff !important;font-size:10px;padding-top:10;margin-top:5px}ion-card-title[_ngcontent-%COMP%]{text-align:left}.error-message[_ngcontent-%COMP%]{color:red;font-size:20px;margin-top:10px}ion-grid.main[_ngcontent-%COMP%]{--ion-grid-padding: 20px;--ion-grid-padding-xs: 20px;--ion-grid-padding-sm: 20px;--ion-grid-padding-md: 20px;--ion-grid-padding-lg: 20px;--ion-grid-padding-xl: 20px;--ion-grid-column-padding: 30px;--ion-grid-column-padding-xs: 30px;--ion-grid-column-padding-sm: 30px;--ion-grid-column-padding-md: 30px;--ion-grid-column-padding-lg: 30px;--ion-grid-column-padding-xl: 30px}ion-col.main[_ngcontent-%COMP%]{background-color:transparent;border:solid 1px #4194ab;color:#0a056f;text-align:center}.ion-activatable[_ngcontent-%COMP%], .phone-link[_ngcontent-%COMP%]{margin-bottom:10px}.ripple-effect-blue[_ngcontent-%COMP%]{color:#010384}.ripple-effect-green[_ngcontent-%COMP%]{color:#08782a}.ripple-effect-lightblue[_ngcontent-%COMP%]{color:#00c8ff}.ripple-effect-red[_ngcontent-%COMP%]{color:#980707}.wrapper[_ngcontent-%COMP%]{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;text-align:center;height:200px;width:200px;margin:0 auto}b[_ngcontent-%COMP%]{width:100%}.ripple-parent[_ngcontent-%COMP%]{display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;border:1px solid #4194ab;width:100%;height:75px;border-radius:8px}.rounded-rectangle[_ngcontent-%COMP%]{width:200px;height:50px;border-radius:8px}"]}),s})()}];let R=(()=>{var n;class s{}return(n=s).\u0275fac=function(i){return new(i||n)},n.\u0275mod=e.oAB({type:n}),n.\u0275inj=e.cJS({imports:[u.Bz.forChild(q),u.Bz]}),s})();var w=l(1664);let S=(()=>{var n;class s{}return(n=s).\u0275fac=function(i){return new(i||n)},n.\u0275mod=e.oAB({type:n}),n.\u0275inj=e.cJS({imports:[c.ez,b.u5,r.Pc,w.e,R]}),s})()}}]);