"use strict";(self.webpackChunkapp=self.webpackChunkapp||[]).push([[3892],{3892:(Ae,L,r)=>{r.r(L),r.d(L,{HelpDeskModule:()=>we});var _=r(6814),m=r(849),u=r(95),U=r(7700),P=r(5861),g=r(553),t=r(9212),A=r(4408),E=r(9862),R=r(7398),k=r(9397);let Z=(()=>{var l;class n{constructor(e){this.http=e,this.baseUrl=g.N.baseUrl,this.apiKey=g.N.apiKey,this.QUICKBASE_URL=g.N.QUICKBASE_URL,this.realm=g.N.realm,this.appId=g.N.appId,this.queryResidentTableId=g.N.queryResidentTableId,this.HelpDeskTableID=g.N.HelpDeskTableID}getHeaders(){return new E.WM({"QB-Realm-Hostname":this.realm,Authorization:`QB-USER-TOKEN ${this.apiKey}`,"Content-Type":"application/json"})}submitTicket(e){console.log("Inserting ticket:",JSON.stringify(e,null,2));const i=this.baseUrl,d={to:this.HelpDeskTableID,data:[e],fieldsToReturn:[3]};return console.log("Request URL:",i,d,{headers:this.getHeaders()}),this.http.post(i,d,{headers:this.getHeaders()}).pipe((0,R.U)(a=>{var c;return console.log("Insert ticket Response:",a),null===(c=a.data[0])||void 0===c?void 0:c[3].value}))}getParticipantNames(){console.log("Querying for active participants:");const e={from:this.queryResidentTableId,select:[3,72],where:"{7.EX.'Area Supervisor'}OR{7.EX.'Program Participant'}OR{7.EX.'House Leader'}OR{7.EX.'Assistant House Leader'}OR{7.EX.'Participant Staff'}OR{7.EX.'Staff'}",options:{orderby:72,skip:0,top:0,compareWithAppLocalTime:!1}};return this.getHeaders(),console.log("Request Staff Tasks URL:",this.QUICKBASE_URL,e,{headers:this.getHeaders()}),this.http.post(this.QUICKBASE_URL,e,{headers:this.getHeaders()}).pipe((0,k.b)(d=>console.log("Response from server:",d)))}}return(l=n).\u0275fac=function(e){return new(e||l)(t.LFG(E.eN))},l.\u0275prov=t.Yz7({token:l,factory:l.\u0275fac,providedIn:"root"}),n})();function q(l,n){if(1&l&&(t.TgZ(0,"ion-select-option",30),t._uU(1),t.qZA()),2&l){const o=n.$implicit;t.Q6J("value",o),t.xp6(),t.Oqu(o.name)}}function Y(l,n){1&l&&(t.TgZ(0,"div"),t._uU(1," Invalid input: Please select a name from the list "),t.qZA())}function B(l,n){1&l&&(t.TgZ(0,"div"),t._uU(1," Invalid input: Please select a Contact Method "),t.qZA())}function $(l,n){1&l&&(t.TgZ(0,"div"),t._uU(1," Invalid input: Please select a Priority "),t.qZA())}function Q(l,n){1&l&&(t.TgZ(0,"div"),t._uU(1," Invalid input: Please enter a detailed description "),t.qZA())}function X(l,n){1&l&&(t.TgZ(0,"div"),t._uU(1," Invalid input: Please enter a detailed description "),t.qZA())}function V(l,n){if(1&l&&(t.TgZ(0,"p"),t._uU(1),t.qZA()),2&l){const o=t.oxw();t.xp6(),t.hij("Record Number: ",o.NewHelpDeskTicketId,"")}}function j(l,n){if(1&l){const o=t.EpF();t.TgZ(0,"div",29),t.NdJ("click",function(){t.CHM(o);const i=t.oxw();return t.KtG(i.reportForm.valid&&i.submitTicket())}),t._uU(1," Submit Help Desk Ticket "),t._UZ(2,"ion-ripple-effect"),t.qZA()}if(2&l){const o=t.oxw();t.ekj("disabled-button",!o.reportForm.valid)}}function W(l,n){if(1&l){const o=t.EpF();t.TgZ(0,"div",29),t.NdJ("click",function(){t.CHM(o);const i=t.oxw();return t.KtG(i.resetForm())}),t._uU(1," Reset Form "),t._UZ(2,"ion-ripple-effect"),t.qZA()}}let G=(()=>{var l;class n{constructor(e,i,d,a){this.router=e,this.HelpDeskService=i,this.formBuilder=d,this.datePipe=a,this.isLoading=!1,this.helpDeskTech=g.N.helpDeskTech,this.NewHelpDeskTicketId=0,this.dropdownChoices=[],this.reportForm=this.formBuilder.group({requestedBy:["",u.kI.required],preferredContactMethod:["",u.kI.required],requestedPriority:["",u.kI.required],ticketName:["",u.kI.required],ticketDefinition:["",u.kI.required],requestedDueDate:[""]})}exitApp(){this.router.navigate(["/login"])}resetForm(){this.reportForm.reset(),this.NewHelpDeskTicketId=0}submitTicket(){var e=this;return(0,P.Z)(function*(){e.isLoading=!0;const d={47:{value:e.reportForm.value.requestedBy.id},12:{value:e.reportForm.value.preferredContactMethod},10:{value:e.reportForm.value.requestedPriority},11:{value:e.reportForm.value.ticketName},9:{value:e.reportForm.value.ticketDefinition},24:{value:{id:e.helpDeskTech}},46:{value:e.datePipe.transform(e.reportForm.value.requestedDueDate,"yyyy-MM-dd")}};console.log("Ticket Body:",d),e.HelpDeskService.submitTicket(d).subscribe(function(){var a=(0,P.Z)(function*(c){console.log("Ticket inserted successfully",c),e.NewHelpDeskTicketId=c,console.log("New Ticket ID:",e.NewHelpDeskTicketId),e.isLoading=!1});return function(c){return a.apply(this,arguments)}}(),a=>{console.error("Error inserting record",a)})})()}ngOnInit(){this.HelpDeskService.getParticipantNames().subscribe(e=>{this.dropdownChoices=e.data.map(i=>({id:i[3].value,name:i[72].value})),this.dropdownChoices.sort((i,d)=>i.name.localeCompare(d.name))},e=>{console.error("Error getting dropdown choices:",e)})}}return(l=n).\u0275fac=function(e){return new(e||l)(t.Y36(A.F0),t.Y36(Z),t.Y36(u.qu),t.Y36(_.uU))},l.\u0275cmp=t.Xpm({type:l,selectors:[["HOMMA-help-desk"]],decls:77,vars:12,consts:[[3,"translucent"],["color","Primary"],[3,"fullscreen"],[1,"logo-container"],["src","assets/logo/HOM.png","alt","Logo"],[1,"ion-text-center"],[1,"HelpTicketSteps"],[3,"formGroup"],["formControlName","requestedBy","label","Requested By","interface","action-sheet","placeholder","Select the your name","cancelText","Cancel Choice","label-placement","floating","fill","outline"],[3,"value",4,"ngFor","ngForOf"],[1,"error-message-text"],[4,"ngIf"],["formControlName","preferredContactMethod","label","Preferred Contact Method","interface","action-sheet","placeholder","How do you prefer to be contacted","label-placement","floating","fill","outline"],["value","Phone"],["value","Email"],["value","Text"],["formControlName","requestedPriority","label","Requested Priority","interface","action-sheet","placeholder","What priority are you requesting?","label-placement","floating","fill","outline"],["value","A"],["value","B"],["value","C"],["value","D"],["value","E"],["formControlName","ticketName","label","Ticket Name","labelPlacement","floating","placeholder","Please enter a title for the ticket here","value","","autoGrow","true",1,"bordered-input"],["formControlName","ticketDefinition","label","Ticket Description","labelPlacement","floating","placeholder","Please describe the issue in full detail","value","","autoGrow","true",1,"bordered-input"],[1,"stacked-label"],["type","date","formControlName","requestedDueDate"],[1,"wrapper"],["class","ion-activatable ripple-parent rounded-rectangle ripple-effect-blue",3,"disabled-button","click",4,"ngIf"],["class","ion-activatable ripple-parent rounded-rectangle ripple-effect-blue",3,"click",4,"ngIf"],[1,"ion-activatable","ripple-parent","rounded-rectangle","ripple-effect-blue",3,"click"],[3,"value"]],template:function(e,i){1&e&&(t.TgZ(0,"ion-header",0)(1,"ion-toolbar")(2,"ion-title",1),t._uU(3," HOM Mobile Assistant - Help Desk "),t.qZA()()(),t.TgZ(4,"ion-content",2)(5,"div",3),t._UZ(6,"img",4),t.qZA(),t.TgZ(7,"ion-card-header",5)(8,"b"),t._uU(9,"How to submit a Help Desk Ticket"),t.qZA()(),t.TgZ(10,"ion-card-subtitle",6)(11,"ul")(12,"li"),t._uU(13,"Choose a priority for your ticket. This is a request, not a guarantee. The helpdesk staff may change the priority level based on the current demand and the nature of your issue."),t.qZA(),t.TgZ(14,"li"),t._uU(15,"Write a brief name of the issue or suggestion that summarizes it."),t.qZA(),t.TgZ(16,"li"),t._uU(17,"Write a detailed description of what you are trying to do, what is happening, what you have tried so far, or what you would like it to do. The more information you provide, the easier it will be for the helpdesk staff to assist you."),t.qZA(),t.TgZ(18,"li"),t._uU(19,"Tap the button to Submit. The helpdesk staff will prioritize your request according to current demands. You may also be contacted if further communication is necessary."),t.qZA()()(),t.TgZ(20,"ion-card")(21,"ion-list",7)(22,"ion-select",8),t.YNc(23,q,2,2,"ion-select-option",9),t.qZA(),t.TgZ(24,"div",10),t.YNc(25,Y,2,0,"div",11),t.qZA(),t._UZ(26,"br"),t.TgZ(27,"ion-select",12)(28,"ion-select-option",13),t._uU(29,"Phone"),t.qZA(),t.TgZ(30,"ion-select-option",14),t._uU(31,"Email"),t.qZA(),t.TgZ(32,"ion-select-option",15),t._uU(33,"Text"),t.qZA()(),t.TgZ(34,"div",10),t.YNc(35,B,2,0,"div",11),t.qZA(),t._UZ(36,"br"),t.TgZ(37,"ion-select",16)(38,"ion-select-option",17),t._uU(39,"Urgent"),t.qZA(),t.TgZ(40,"ion-select-option",18),t._uU(41,"Important"),t.qZA(),t.TgZ(42,"ion-select-option",19),t._uU(43,"ASAP"),t.qZA(),t.TgZ(44,"ion-select-option",20),t._uU(45,"Low Priority"),t.qZA(),t.TgZ(46,"ion-select-option",21),t._uU(47,"As Needed"),t.qZA()(),t.TgZ(48,"div",10),t.YNc(49,$,2,0,"div",11),t.qZA(),t.TgZ(50,"ion-list")(51,"ion-item"),t._UZ(52,"ion-textarea",22),t.qZA(),t.TgZ(53,"div",10),t.YNc(54,Q,2,0,"div",11),t.qZA(),t._UZ(55,"br"),t.TgZ(56,"ion-list")(57,"ion-item"),t._UZ(58,"ion-textarea",23),t.qZA(),t.TgZ(59,"div",10),t.YNc(60,X,2,0,"div",11),t.qZA()(),t._UZ(61,"br"),t.TgZ(62,"ion-item")(63,"div",24)(64,"label"),t._uU(65,"Requested Due Date (Optional)"),t.qZA(),t._UZ(66,"ion-input",25),t.qZA()(),t._UZ(67,"br"),t.TgZ(68,"div",26),t.YNc(69,V,2,1,"p",11)(70,j,3,2,"div",27)(71,W,3,0,"div",28),t.TgZ(72,"div",26),t._UZ(73,"br"),t.TgZ(74,"div",29),t.NdJ("click",function(){return i.exitApp()}),t._uU(75," Return to Login Page "),t._UZ(76,"ion-ripple-effect"),t.qZA()()()()()()()),2&e&&(t.Q6J("translucent",!0),t.xp6(4),t.Q6J("fullscreen",!0),t.xp6(17),t.Q6J("formGroup",i.reportForm),t.xp6(2),t.Q6J("ngForOf",i.dropdownChoices),t.xp6(2),t.Q6J("ngIf",(null==i.reportForm.controls.requestedBy?null:i.reportForm.controls.requestedBy.invalid)&&i.reportForm.controls.requestedBy.touched),t.xp6(10),t.Q6J("ngIf",(null==i.reportForm.controls.preferredContactMethod?null:i.reportForm.controls.preferredContactMethod.invalid)&&i.reportForm.controls.preferredContactMethod.touched),t.xp6(14),t.Q6J("ngIf",(null==i.reportForm.controls.requestedPriority?null:i.reportForm.controls.requestedPriority.invalid)&&i.reportForm.controls.requestedPriority.touched),t.xp6(5),t.Q6J("ngIf",(null==i.reportForm.controls.ticketName?null:i.reportForm.controls.ticketName.invalid)&&i.reportForm.controls.ticketName.touched),t.xp6(6),t.Q6J("ngIf",(null==i.reportForm.controls.ticketDefinition?null:i.reportForm.controls.ticketDefinition.invalid)&&i.reportForm.controls.ticketDefinition.touched),t.xp6(9),t.Q6J("ngIf",i.NewHelpDeskTicketId),t.xp6(),t.Q6J("ngIf",!i.NewHelpDeskTicketId),t.xp6(),t.Q6J("ngIf",i.NewHelpDeskTicketId))},dependencies:[_.sg,_.O5,u.JJ,u.JL,m.PM,m.Zi,m.tO,m.W2,m.Gu,m.pK,m.Ie,m.q_,m.H$,m.t9,m.n0,m.g2,m.wd,m.sr,m.QI,m.j9,u.sg,u.u],styles:["#container[_ngcontent-%COMP%]{text-align:center;position:absolute;left:0;right:0;top:50%;transform:translateY(-50%)}.body-text[_ngcontent-%COMP%]{font-size:12px;line-height:16px;margin-top:0}.logo-container[_ngcontent-%COMP%]{text-align:center;margin-left:15px;margin-top:10px;margin-bottom:10px}#container[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%]{font-size:14px;line-height:18px}ion-card-title.ion-text-center[_ngcontent-%COMP%]{font-size:26px;font-weight:bolder;color:#980707}.fields-container[_ngcontent-%COMP%]{display:flex;justify-content:space-evenly}#container[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]{font-size:12px;line-height:16px;color:#2b9c4d;margin:0}.info-container[_ngcontent-%COMP%]{display:flex;justify-content:space-between}ul[_ngcontent-%COMP%]{list-style-type:decimal;padding:1}.HelpTicketSteps[_ngcontent-%COMP%]{font-size:12px;color:#2600ff;padding-left:5px;padding-right:15px;padding-top:0}.info-item[_ngcontent-%COMP%]{padding:0}#container[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]{text-decoration:none}ion-card-header[_ngcontent-%COMP%]{font-family:Trebuchet MS;font-size:22px;font-weight:bolder;color:#2600ff;padding-bottom:0}ion-header[_ngcontent-%COMP%]{--ion-background-color: #4194ab !important;--ion-color-base: #fff !important}ion-title[_ngcontent-%COMP%]{font-size:1.1em;font-weight:400;text-shadow:none}ion-content[_ngcontent-%COMP%]{--ion-font-size: 12px}ion-buttons[_ngcontent-%COMP%]{font-size:1.1em}.ripple-effect-blue[_ngcontent-%COMP%]{color:#010384}.ripple-effect-lightblue[_ngcontent-%COMP%]{color:#00c8ff}.ripple-effect-red[_ngcontent-%COMP%]{color:#980707}.wrapper[_ngcontent-%COMP%]{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;text-align:center;height:100px;width:300px;margin:0 auto}b[_ngcontent-%COMP%]{width:100%}.ripple-parent[_ngcontent-%COMP%]{display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;border:1px solid #4194ab;width:100%;height:50px;border-radius:8px}.rounded-rectangle[_ngcontent-%COMP%]{width:300px;height:50px;border-radius:8px}"]}),n})();var x=r(3680),D=r(799),y=r(9594),oe=(r(5643),r(2831),r(6825),r(7394),r(8645),r(4911),r(3019),r(2096),r(2438),r(6028),r(8484),r(7131));let fe=(()=>{var l;class n{}return(l=n).\u0275fac=function(e){return new(e||l)},l.\u0275mod=t.oAB({type:l}),l.\u0275inj=t.cJS({imports:[x.BQ,_.ez,oe.Q8,x.BQ]}),n})();r(7921),r(4664),r(8180),r(2181),r(5177),r(9388);const ve={provide:new t.OlP("mat-autocomplete-scroll-strategy",{providedIn:"root",factory:()=>{const l=(0,t.f3M)(y.aV);return()=>l.scrollStrategies.reposition()}}),deps:[y.aV],useFactory:function be(l){return()=>l.scrollStrategies.reposition()}};let Fe=(()=>{var l;class n{}return(l=n).\u0275fac=function(e){return new(e||l)},l.\u0275mod=t.oAB({type:l}),l.\u0275inj=t.cJS({providers:[ve],imports:[y.U8,x.Ng,x.BQ,_.ez,D.ZD,x.Ng,x.BQ]}),n})();const Me=[{path:"",component:G}];let we=(()=>{var l;class n{}return(l=n).\u0275fac=function(e){return new(e||l)},l.\u0275mod=t.oAB({type:l}),l.\u0275inj=t.cJS({providers:[_.uU],imports:[_.ez,u.u5,m.Pc,Fe,fe,u.UX,U.Is,A.Bz.forChild(Me),A.Bz]}),n})()}}]);