"use strict";(self.webpackChunkapp=self.webpackChunkapp||[]).push([[3687],{3687:(Z,u,s)=>{s.r(u),s.d(u,{LoginPageModule:()=>P});var d=s(6814),c=s(95),r=s(451),l=s(4091),e=s(9212),p=s(6311);function m(o,i){if(1&o&&(e.TgZ(0,"div",9),e._uU(1),e.qZA()),2&o){const a=e.oxw();e.xp6(),e.hij(" ",a.errorMessage," ")}}const f=[{path:"",component:(()=>{var o;class i{constructor(n,t){this.router=n,this.quickbaseService=t,this.username="",this.password="",this.errorMessage=""}ngOnInit(){this.quickbaseService.errorMessage$.subscribe(n=>{this.errorMessage=n})}login(){console.log("Username:",this.username),this.quickbaseService.query(this.username).subscribe(n=>{var t;console.log("API Response:",n);const g=null===(t=n.data[0])||void 0===t?void 0:t[3];console.log("Record Number:",g),console.log("Type of Record Number:",typeof g),g&&this.router.navigate(["/home",{recordNumber:JSON.stringify(g)}])},n=>{console.error("API Error:",n)})}}return(o=i).\u0275fac=function(n){return new(n||o)(e.Y36(l.F0),e.Y36(p.x))},o.\u0275cmp=e.Xpm({type:o,selectors:[["app-login"]],decls:24,vars:4,consts:[[3,"translucent"],["color","Primary"],[3,"fullscreen"],[1,"ion-text-center"],["src","https://yourroofmedic.com/wp-content/uploads/2023/02/RoofMedic_Logo_400.png","alt","Logo"],["class","error-message",4,"ngIf"],["placeholder","Valid Email Address",3,"ngModel","ngModelChange"],["placeholder","Password","type","password"],["expand","block",3,"click"],[1,"error-message"]],template:function(n,t){1&n&&(e.TgZ(0,"ion-header",0)(1,"ion-toolbar")(2,"ion-title",1),e._uU(3," Geo Location Tracking App "),e.qZA()()(),e.TgZ(4,"ion-content",2)(5,"ion-card",3),e._UZ(6,"img",4),e.TgZ(7,"ion-card-header"),e._UZ(8,"br")(9,"br"),e.TgZ(10,"ion-card-title"),e._uU(11,"Enter your QuickBase login email and password,"),e._UZ(12,"br"),e._uU(13,"then and click the blue button to enter."),e.qZA(),e.YNc(14,m,2,1,"div",5),e.qZA(),e.TgZ(15,"ion-card-content")(16,"ion-item")(17,"ion-input",6),e.NdJ("ngModelChange",function(M){return t.username=M}),e.qZA()(),e._UZ(18,"br"),e.TgZ(19,"ion-item"),e._UZ(20,"ion-input",7),e.qZA(),e._UZ(21,"br"),e.TgZ(22,"ion-button",8),e.NdJ("click",function(){return t.login()}),e._uU(23,"Enter"),e.qZA()()()()),2&n&&(e.Q6J("translucent",!0),e.xp6(4),e.Q6J("fullscreen",!0),e.xp6(10),e.Q6J("ngIf",t.errorMessage),e.xp6(3),e.Q6J("ngModel",t.username))},dependencies:[d.O5,c.JJ,c.On,r.YG,r.PM,r.FN,r.Zi,r.Dq,r.W2,r.Gu,r.pK,r.Ie,r.wd,r.sr,r.j9],styles:["ion-header[mode=ios][_ngcontent-%COMP%]{--background: #d40000;--color: #fff}ion-header[_ngcontent-%COMP%]:not([mode=ios]){--background: #d40000;--color: #fff}.error-message[_ngcontent-%COMP%]{color:red;font-size:20px;margin-top:10px}"]}),i})()}];let h=(()=>{var o;class i{}return(o=i).\u0275fac=function(n){return new(n||o)},o.\u0275mod=e.oAB({type:o}),o.\u0275inj=e.cJS({imports:[l.Bz.forChild(f),l.Bz]}),i})(),P=(()=>{var o;class i{}return(o=i).\u0275fac=function(n){return new(n||o)},o.\u0275mod=e.oAB({type:o}),o.\u0275inj=e.cJS({imports:[d.ez,c.u5,r.Pc,h]}),i})()}}]);