"use strict";(self.webpackChunkapp=self.webpackChunkapp||[]).push([[5944],{5944:(b,p,t)=>{t.r(p),t.d(p,{ResidentInfoModule:()=>M});var d=t(6814),i=t(849),c=t(9353),n=t(9212),m=t(1351),u=t(4408),I=t(6593),f=t(491);function h(o,a){if(1&o&&n._UZ(0,"img",19),2&o){const s=n.oxw();n.Q6J("src",s.residentInfo.residentPhoto,n.LSH)}}let C=(()=>{var o;class a{constructor(l,e,r,Z,O){this.residentInfoService=l,this.route=e,this.sanitizer=r,this.dialog=Z,this.router=O}getSafeHtml(l){return this.sanitizer.bypassSecurityTrustHtml(l)}exitApp(){this.router.navigate(["/login"])}registerClass(){console.log("Class Registration button clicked")}promptAction(l,e){this.dialog.open(c.a,{data:{phoneNumber:l,name:e}})}payNow(){window.location.href="https://houseofmercyministries.net/payments/"}ngOnInit(){this.residentInfo=this.residentInfoService.ppData(),console.log("Resident Info:",this.residentInfo)}}return(o=a).\u0275fac=function(l){return new(l||o)(n.Y36(m.d),n.Y36(u.gz),n.Y36(I.H7),n.Y36(f.uw),n.Y36(u.F0))},o.\u0275cmp=n.Xpm({type:o,selectors:[["HOMMA-resident-info"]],decls:89,vars:38,consts:[[3,"translucent"],["color","Primary"],[3,"fullscreen"],[1,"logo-container"],["src","assets/logo/HOM3.png","alt","Logo"],[1,"ion-text-center"],["alt","Resident Photo","class","thumbnail centered-photo",3,"src",4,"ngIf"],[1,"phone-link"],[3,"click"],[1,"main",3,"fixed"],["size","6",1,"main"],[1,"main"],[1,"main",2,"font-size","x-small"],[3,"innerHTML"],[1,"button-container"],[1,"wrapper"],[1,"ion-activatable","ripple-parent","rounded-rectangle","ripple-effect-red",3,"click"],[1,"ion-activatable","ripple-parent","rounded-rectangle","ripple-effect-lightblue",3,"click"],[1,"ion-activatable","ripple-parent","rounded-rectangle","ripple-effect-blue",3,"click"],["alt","Resident Photo",1,"thumbnail","centered-photo",3,"src"]],template:function(l,e){1&l&&(n.TgZ(0,"ion-header",0)(1,"ion-toolbar")(2,"ion-title",1),n._uU(3," HOM Mobile Assistant - Participant Information "),n.qZA()()(),n.TgZ(4,"ion-content",2)(5,"div",3),n._UZ(6,"img",4),n.qZA(),n.TgZ(7,"ion-card")(8,"ion-card-header",5),n.YNc(9,h,1,1,"img",6),n._uU(10),n._UZ(11,"br"),n._uU(12),n._UZ(13,"br"),n._uU(14),n._UZ(15,"br"),n.TgZ(16,"ion-card-subtitle",7),n._uU(17),n.TgZ(18,"a",8),n.NdJ("click",function(){return e.promptAction(e.residentInfo.CareMgrPhone.value,e.residentInfo.CareMgrName.value)}),n._uU(19),n.qZA()(),n.TgZ(20,"ion-card-subtitle",7),n._uU(21),n.TgZ(22,"a",8),n.NdJ("click",function(){return e.promptAction(e.residentInfo.ProgMgrPhone.value,e.residentInfo.ProgMgrName.value)}),n._uU(23),n.qZA()(),n.TgZ(24,"ion-card-subtitle",7),n._uU(25),n.TgZ(26,"a",8),n.NdJ("click",function(){return e.promptAction(e.residentInfo.ProgDirPhone.value,e.residentInfo.ProgDirName.value)}),n._uU(27),n.qZA()()(),n.TgZ(28,"ion-card-content")(29,"ion-grid",9)(30,"ion-row")(31,"ion-col",10),n._uU(32),n.qZA(),n.TgZ(33,"ion-col",10),n._uU(34),n.ALo(35,"date"),n._UZ(36,"br"),n._uU(37),n.qZA()(),n.TgZ(38,"ion-row")(39,"ion-col",10),n._uU(40,"Bed Start Date:"),n._UZ(41,"br"),n._uU(42),n.ALo(43,"date"),n.qZA(),n.TgZ(44,"ion-col",10),n._uU(45),n.qZA()(),n.TgZ(46,"ion-row")(47,"ion-col",11),n._uU(48),n._UZ(49,"br"),n._uU(50),n.qZA(),n.TgZ(51,"ion-col",12),n._uU(52,"CCO Contact Info"),n._UZ(53,"br"),n._uU(54),n._UZ(55,"br"),n._uU(56,"Phone: "),n.TgZ(57,"a",8),n.NdJ("click",function(){return e.promptAction(null==e.residentInfo?null:e.residentInfo.residentCCOphone.value,null==e.residentInfo?null:e.residentInfo.residentCCOphone.value)}),n._uU(58),n.qZA(),n._UZ(59,"br"),n._uU(60,"Mobile: "),n.TgZ(61,"a",8),n.NdJ("click",function(){return e.promptAction(null==e.residentInfo?null:e.residentInfo.residentCCOmobile.value,null==e.residentInfo?null:e.residentInfo.residentCCOmobile.value)}),n._uU(62),n.qZA()()(),n.TgZ(63,"ion-row")(64,"ion-col",11),n._uU(65,"Fees Due First of Month:"),n._UZ(66,"br")(67,"div",13),n.qZA(),n.TgZ(68,"ion-col",11),n._uU(69),n.ALo(70,"currency"),n.qZA()(),n.TgZ(71,"ion-row")(72,"ion-col",11),n._uU(73,"Financial Status:"),n._UZ(74,"br")(75,"div",13),n.qZA(),n.TgZ(76,"ion-col",11),n._uU(77),n.qZA()()()()(),n.TgZ(78,"div",14)(79,"div",15)(80,"div",16),n.NdJ("click",function(){return e.payNow()}),n._uU(81," Pay Now "),n._UZ(82,"ion-ripple-effect"),n.qZA(),n.TgZ(83,"div",17),n.NdJ("click",function(){return e.registerClass()}),n._uU(84," Class Registration "),n._UZ(85,"ion-ripple-effect"),n.qZA(),n.TgZ(86,"div",18),n.NdJ("click",function(){return e.exitApp()}),n._uU(87," Return to Login Page "),n._UZ(88,"ion-ripple-effect"),n.qZA()()()()),2&l&&(n.Q6J("translucent",!0),n.xp6(4),n.Q6J("fullscreen",!0),n.xp6(5),n.Q6J("ngIf",null==e.residentInfo?null:e.residentInfo.residentPhoto),n.xp6(),n.hij(" Participant Name: ",null==e.residentInfo?null:e.residentInfo.residentName.value,""),n.xp6(2),n.hij(" House Name: ",null==e.residentInfo?null:e.residentInfo.theHouseName.value,""),n.xp6(2),n.hij(" Participant Status: ",null==e.residentInfo?null:e.residentInfo.participantStatus.value,""),n.xp6(3),n.hij("Care Navigator: ",null==e.residentInfo?null:e.residentInfo.CareMgrName.value," "),n.xp6(2),n.Oqu(null==e.residentInfo?null:e.residentInfo.CareMgrPhone.value),n.xp6(2),n.hij("Program Manager: ",null==e.residentInfo?null:e.residentInfo.ProgMgrName.value," "),n.xp6(2),n.Oqu(null==e.residentInfo?null:e.residentInfo.ProgMgrPhone.value),n.xp6(2),n.hij("Program Director: ",null==e.residentInfo?null:e.residentInfo.ProgDirName.value," "),n.xp6(2),n.Oqu(null==e.residentInfo?null:e.residentInfo.ProgDirPhone.value),n.xp6(2),n.Q6J("fixed",!0),n.xp6(3),n.hij("Participant Phone#: ",null==e.residentInfo?null:e.residentInfo.residentPhone.value,""),n.xp6(2),n.hij("Participant DOB: ",n.xi3(35,28,null==e.residentInfo?null:e.residentInfo.residentDOB.value,"MMM-dd-yyyy"),""),n.xp6(3),n.hij("Age: ",null==e.residentInfo?null:e.residentInfo.residentAge.value,""),n.xp6(5),n.hij(" ",n.xi3(43,31,null==e.residentInfo||null==e.residentInfo.residentBedStart?null:e.residentInfo.residentBedStart.value,"MMM-dd-yyyy"),""),n.xp6(3),n.hij("S/O Level: ",null==e.residentInfo?null:e.residentInfo.SOLevel.value,""),n.xp6(3),n.hij("Room #: ",null==e.residentInfo?null:e.residentInfo.Room.value,""),n.xp6(2),n.Oqu(null==e.residentInfo?null:e.residentInfo.Bed.value),n.xp6(4),n.AsE("Name: ",null==e.residentInfo?null:e.residentInfo.residentCCOfirst.value," ",null==e.residentInfo?null:e.residentInfo.residentCCOlast.value,""),n.xp6(4),n.Oqu(null==e.residentInfo?null:e.residentInfo.residentCCOphone.value),n.xp6(4),n.Oqu(null==e.residentInfo?null:e.residentInfo.residentCCOmobile.value),n.xp6(5),n.Q6J("innerHTML",e.getSafeHtml(null==e.residentInfo||null==e.residentInfo.FeesDueFirstofMonth?null:e.residentInfo.FeesDueFirstofMonth.value),n.oJD),n.xp6(2),n.hij("Past Due Fees: ",n.Dn7(70,34,null==e.residentInfo||null==e.residentInfo.PastDueFees?null:e.residentInfo.PastDueFees.value,"USD","symbol"),""),n.xp6(6),n.Q6J("innerHTML",e.getSafeHtml(null==e.residentInfo||null==e.residentInfo.FinancialStatus?null:e.residentInfo.FinancialStatus.value),n.oJD),n.xp6(2),n.hij("Active Payplans: ",null==e.residentInfo?null:e.residentInfo.ActivePayplans.value,""))},dependencies:[d.O5,i.PM,i.FN,i.Zi,i.tO,i.wI,i.W2,i.jY,i.Gu,i.H$,i.Nd,i.wd,i.sr,d.H9,d.uU],styles:[".thumbnail[_ngcontent-%COMP%]{width:100px;height:130px;object-fit:cover}.centered-photo[_ngcontent-%COMP%]{display:block;margin-left:auto;margin-right:auto}.phone-link[_ngcontent-%COMP%]{font-weight:700;margin-bottom:0}#container[_ngcontent-%COMP%]{text-align:center;position:absolute;left:0;right:0;top:50%;transform:translateY(-50%)}.body-text[_ngcontent-%COMP%]{font-size:12px;line-height:16px;margin-top:0}.center-content[_ngcontent-%COMP%]{display:flex;flex-direction:column;align-items:center;justify-content:center}.logo-container[_ngcontent-%COMP%]{text-align:center;margin-left:15px;margin-top:10px;margin-bottom:10px}#container[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%]{font-size:14px;line-height:18px}ion-card-title.ion-text-center[_ngcontent-%COMP%]{font-size:26px;font-weight:bolder;color:#980707}.alert-format[_ngcontent-%COMP%]{font-size:12px;font-weight:700;color:#fa071b;margin:20px 40px 0;line-height:20px}ion-grid.main[_ngcontent-%COMP%]{--ion-grid-padding: 20px;--ion-grid-padding-xs: 20px;--ion-grid-padding-sm: 20px;--ion-grid-padding-md: 20px;--ion-grid-padding-lg: 20px;--ion-grid-padding-xl: 20px;--ion-grid-column-padding: 30px;--ion-grid-column-padding-xs: 30px;--ion-grid-column-padding-sm: 30px;--ion-grid-column-padding-md: 30px;--ion-grid-column-padding-lg: 30px;--ion-grid-column-padding-xl: 30px}ion-col.main[_ngcontent-%COMP%]{background-color:transparent;border:solid 1px #4194ab;color:#0a056f;text-align:center}.fields-container[_ngcontent-%COMP%]{display:flex;justify-content:space-evenly}#container[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]{font-size:12px;line-height:16px;color:#2b9c4d;margin:0}.info-container[_ngcontent-%COMP%]{display:flex;justify-content:space-between}.info-item[_ngcontent-%COMP%]{margin:0}#container[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]{text-decoration:none}ion-header[_ngcontent-%COMP%]{--ion-background-color: #4194ab !important;--ion-color-base: #fff !important}ion-title[_ngcontent-%COMP%]{font-size:1.1em;font-weight:400;text-shadow:none}ion-content[_ngcontent-%COMP%]{--ion-font-size: 12px}ion-buttons[_ngcontent-%COMP%]{font-size:1.1em}.ripple-effect-blue[_ngcontent-%COMP%]{color:#010384}.ripple-effect-lightblue[_ngcontent-%COMP%]{color:#00c8ff}.ripple-effect-red[_ngcontent-%COMP%]{color:#980707}.button-container[_ngcontent-%COMP%]{display:flex;justify-content:center;align-items:center;padding-bottom:20px;margin-bottom:20px}.wrapper[_ngcontent-%COMP%]{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px;text-align:center;height:100px;width:200px;margin:0 auto}.ion-activatable[_ngcontent-%COMP%]{margin-bottom:10px}b[_ngcontent-%COMP%]{width:100%}.ripple-parent[_ngcontent-%COMP%]{display:flex;align-items:center;justify-content:center;gap:5px;position:relative;overflow:hidden;border:1px solid #4194ab}.rounded-rectangle[_ngcontent-%COMP%]{width:200px;height:50px;border-radius:8px}"]}),a})();var g=t(95),_=t(1043),v=t(1664);const P=[{path:"",component:C}];let M=(()=>{var o;class a{}return(o=a).\u0275fac=function(l){return new(l||o)},o.\u0275mod=n.oAB({type:o}),o.\u0275inj=n.cJS({imports:[d.ez,g.u5,i.Pc,_.lN,v.e,g.UX,f.Is,u.Bz.forChild(P),u.Bz]}),a})()}}]);