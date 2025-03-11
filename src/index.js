import { Abracadabra } from "abracadabra-cn";
var Abra = new Abracadabra();
function randomString(length) {
    var str = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var result = '';
    for (var i = length; i > 0; --i) 
        result += str[Math.floor(Math.random() * str.length)];
    return result;
}

var RootNode = document.createElement("div");
var RootID = randomString(6);
RootNode.id = RootID;



var ShadowRoot = RootNode.attachShadow({mode:"open"});

ShadowRoot.innerHTML = `<style>
		#Abracadabra_Card{
			height: 130px;
			width: 200px;
			border-radius: 8px;
			background: background-color: #8EC5FC;
            background-image: linear-gradient(62deg, #8EC5FC 0%, #E0C3FC 100%);
			box-shadow: 0px 5px 10px 3px #8c8c8c;
			display:grid;
			grid-template-rows: 33% 33% 33%;
		};
		.button{
			opacity: 0.7;
		}
		.button:active{
			opacity: 0.5;
		}
		</style>
	<div id="Abracadabra_Card">
		<div id="InputAContainer" style="display:grid;">
			<input id="originalText" style="			
		    width: 180px;
			top: 7px;
			height: 28px;
			justify-self: center;
			border-radius: 8px;
			border: solid 1px #00000080;
			opacity: 0.7;
			position: relative;" type="text" placeholder="待处理文本">
		<div id="KeyAndButtonContainer" style="display:grid;grid-template-columns: 50% 25% 25%;margin-top: 10px;">
			<input id="KeyText" style="			
			width: 100px;
			top: 0px;
			left: 7px;
			height: 18px;
			justify-self: left;
			border-radius: 8px;
			border: solid 1px #00000080;
			opacity: 0.7;
			position: relative;" type="text" placeholder="密钥(可省略)">
		    <button id="Enc" class="button" style="			
			width: 38px;
			top: 0px;
			left: 9px;
			height: 22px;
			justify-self: center;
			border-radius: 8px;
			border: solid 1px #00000080;
			position: relative;
			background: #5D73F8;
		    color:white;
		    white-space: nowrap;">加密</button>
	   <button id="Dec" class="button" style="			
			width: 38px;
			top: 0px;
			left: -1px;
			height: 22px;
			justify-self: center;
			border-radius: 8px;
			border: solid 1px #00000080;
			position: relative;
			background: #ff5c82;
		    color:white;
		    white-space: nowrap;">解密
		</button>
		</div>
		<div id="OutputContainer" style="display:grid;margin-top: 10px;">
			<input id="OutputText" style="			
			width: 180px;
			top: -3px;
			height: 36px;
			justify-self: center;
			border-radius: 8px;
			border: solid 1px #00000080;
			opacity: 0.7;
			position: relative;" type="text" placeholder="输出">
			<span style="
			position: relative;
			width: fit-content;
			height: fit-content;
			top: -7px;
			left: 7px;
			font-size: 1rem;
			font-variant: petite-caps;
			text-align: left;
			padding: 6px;
			border-radius: inherit;
			margin: 0px;
			zoom: 70%;">Powered by <a href="https://github.com/SheepChef/Abracadabra">ABRACADABRA</a></span>
		</div>
	    </div>
	</div>`


ShadowRoot.getElementById("Enc").addEventListener("click", event =>{
    var Text = ShadowRoot.getElementById("originalText").value;
    var Key = (ShadowRoot.getElementById("KeyText").value == "") ? "ABRACADABRA" : ShadowRoot.getElementById("KeyText").value
    Abra.Input_Next(Text,"ENCRYPT",Key,true,50);
    var Res = Abra.Output();
    ShadowRoot.getElementById("OutputText").value = Res;
    ShadowRoot.getElementById("OutputText").select();
    navigator.clipboard.writeText(window.getSelection().toString());
})

ShadowRoot.getElementById("Dec").addEventListener("click", event =>{
    var Text = ShadowRoot.getElementById("originalText").value;
    var Key = (ShadowRoot.getElementById("KeyText").value == "") ? "ABRACADABRA" : ShadowRoot.getElementById("KeyText").value
    Abra.Input_Next(Text,"DECRYPT",Key);
    var Res = Abra.Output();
    ShadowRoot.getElementById("OutputText").value = Res;
    ShadowRoot.getElementById("OutputText").select();
    navigator.clipboard.writeText(window.getSelection().toString());
})

RootNode.addEventListener("mouseenter",event =>{

    RootNode.style.opacity = "1";

});

RootNode.addEventListener("mouseout", event =>{

    if(document.activeElement.id != RootID){
        RootNode.style.opacity = "0.3";
    }
});

RootNode.addEventListener("focus",event =>{

    RootNode.style.opacity = "1";

});

RootNode.addEventListener("focusout",event =>{

    RootNode.style.opacity = "0.3";

});

if(document.location.host == "tieba.baidu.com"){ //贴吧特有样式
    RootNode.style = `transition: 1s;
    opacity: 0.3;
    position: fixed;
    left: 50%;
    bottom: 100px;
    margin-left: 275px;`;

    document.querySelector("#tb_rich_poster > div.poster_body.editor_wrapper > div.poster_component.editor_content_wrapper.ueditor_container > div.old_style_wrapper").appendChild(RootNode);
}else if(document.location.host == "www.bilibili.com"){
    RootNode.style = `transition: 1s;
    opacity: 0.3;
    position: fixed;
    right: 50%;
    margin-right: 737px;
    z-index: 100000;
    bottom: 10px;
    zoom: 70%;`;

    document.querySelector("#commentapp").appendChild(RootNode);

}







