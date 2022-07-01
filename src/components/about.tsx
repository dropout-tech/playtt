import React from "react";
import styled from "styled-components";
import about1 from "../assets/about/about1.png";
import about2 from "../assets/about/about2.png";
import about3 from "../assets/about/about3.png";
import about1m from "../assets/about/about1-m.png";
import about2m from "../assets/about/about2-m.png";
import about3m from "../assets/about/about3-m.png";



// styled components start 

const PageContainer = styled.div`
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  @media screen and (max-width: 414px) {

  }
`;


const Container = styled.div`
 @media screen and (min-width: 1440px) {
     width:100%;
     margin-top:200px;
     padding-bottom: 104px;
  }
  @media screen and (max-width: 1440px) {
     width:100%;
     padding-bottom: 104px;
     margin-top:200px;

  }

  @media screen and (max-width: 1280px) {
    display:flex;
    flex-direction: column;
  }
  
 @media screen and (max-width: 768px) {
   display:none;
  }

 @media screen and (max-width: 414px) {
    display:none;
  }
 
`;

const AboutText = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-Weight:900;
  font-size: 36px;
  line-height: 52px;
  letter-spacing: 0.04em;
  color: #1A1A1A;
  text-align: center;
  margin:0px;
  @media screen and (max-width: 768px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 900;
    font-size: 30px;
    line-height: 44px;
    text-align: center;
    letter-spacing: 0.04em;
    color: #1A1A1A;

    

  }
  @media screen and (max-width: 414px) {
    font-family: 'Noto Sans TC';
    font-style: normal;
    font-weight: 900;
    font-size: 26px;
    line-height: 40px;
    letter-spacing: 0.04em;
    color: #1A1A1A;
    display:flex;
    justify-content:center;
    align-items: center;
    margin-top:-10px;
  }
`;

const AboutUs = styled.p`
  font-family: 'Futura';
  font-style: normal;
  font-weight: 700;
  font-size: 36px;
  line-height: 52px;
  text-align: center;
  letter-spacing: 0.04em;
  color: #CFD2D3;
  margin-top:8px;

   @media screen and (max-width: 768px) {
    font-family: 'Futura';
    font-style: normal;
    font-weight: 700;
    font-size: 30px;
    line-height: 44px;
    text-align: center;
    letter-spacing: 0.04em;
  }
  @media screen and (max-width: 414px) {
    font-family: 'Futura';
    font-style: normal;
    font-weight: 700;
    font-size: 26px;
    line-height: 40px;
    letter-spacing: 0.04em;
    color: #CFD2D3;
    margin-left:0px;
    margin-top:0px;

  }
`;


const AboutItems = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: column;
  /* margin-top:80px; */
  margin-bottom:100px;
  @media screen and (max-width: 768px) {
    margin-bottom:60px;
  }
`;

const MobileContainer = styled.div`
 @media screen and (min-width: 1440px) {
  
   display:none;
  }
 @media screen and (max-width: 1440px) {
  
   display:none;
  }
 @media screen and (max-width: 1280px) {
  
   display:none;
  }

   @media screen and (max-width: 1024px) {
  
   display:none;
  }

   @media screen and (max-width: 768px) {
    display:flex;
    flex-direction:column;
  }
  
  
`;


/* desktop thw newest info style end */
const About = () => {
  return <PageContainer id="about">
    <Container>
      <AboutItems>
        <AboutText>關於我們</AboutText>
        <AboutUs>About Us</AboutUs>
      </AboutItems>
      <div style={{display:"flex",flexDirection:"row",alignItems:"center",justifyContent:"center",paddingLeft:"30px",paddingRight:"30px",marginBottom:120}}>
          <img src={about1} style={{width:207,height:370,marginRight:103}} alt="" />
          <div style={{display:"flex",flexDirection:"column",width:"680px"}}>
              <h2 style={{fontSize:"30px",fontWeight:"900",color:"#1A1A1A",fontFamily:"Noto Sans TC",margin:0}}>我們的夢想</h2>
              <h2  style={{fontSize:"26px",fontWeight:"700",color:"#1A1A1A",fontFamily:"Futura",fontStyle:"normal",marginTop:10,marginBottom:24}}>Let's Play Dream</h2>
              <p  style={{fontSize:"20px",fontWeight:"500",color:"#1A1A1A",fontFamily:"Noto Sans TC",margin:0,lineHeight:"36px",textAlign:"justify"}}>我我們有個小小的願望，就是和大家一起「玩」桌球，透過輕鬆玩，讓全身細胞體會動起來的暢快感!我們有個大大的夢想，藉由「玩」桌球，跨越單純的運動本身、與各種可能性結合，讓桌球走進你我的生活中，帶著爸爸、媽媽、阿公、阿嬤、叔叔、伯伯、阿姨、姑姑、哥哥、姊姊、弟弟、妹妹、朋友所有人一起 <span style={{fontFamily:"Futura"}}>Let's Play !</span></p>
              <p style={{fontSize:"20px",fontWeight:"900",color:"#1A1A1A",fontFamily:"Noto Sans TC",marginTop:16}}>感受發自內心的快樂，一起來玩吧！</p>
          </div>
      </div>
      <div style={{display:"flex",flexDirection:"row",alignItems:"center",justifyContent:"center",paddingLeft:"30px",paddingRight:"30px",marginBottom:120}}>
          <img src={about2} style={{width:207,height:370,marginRight:103}} alt="" />
          <div style={{display:"flex",flexDirection:"column",width:"680px"}}>
              <h2 style={{fontSize:"30px",fontWeight:"900",color:"#1A1A1A",fontFamily:"Noto Sans TC",margin:0}}>我們的故事</h2>
              <h2  style={{fontSize:"26px",fontWeight:"700",color:"#1A1A1A",fontFamily:"Futura",fontStyle:"normal",marginTop:10,marginBottom:24}}>Let's Play Story</h2>
              <p  style={{fontSize:"20px",fontWeight:"500",color:"#1A1A1A",fontFamily:"Noto Sans TC",margin:0,lineHeight:"36px",textAlign:"justify"}}><span style={{fontFamily:"Futura"}}>Let's Play !</span> 創立於 <span style={{fontFamily:"Futura"}}>2018</span> 年，創辦人阿寬教練畢業於桌球名校麗山國中與松山家商，大學時期深受林學宜教授的啟發，非常懂得職業球員訓練的辛苦，但他其實更想分享給大家的是，如何和大家快樂的「玩」桌球！孩子可以培養信心與專注力、上班族可以釋放壓力、年長者可以擁有豐富退休生活的樂趣!</p>
              <p style={{fontSize:"20px",fontWeight:"500",color:"#1A1A1A",fontFamily:"Noto Sans TC",margin:0,lineHeight:"36px",textAlign:"justify"}}>此外，從桌球同業的夥伴聯盟合作與跨領域的異業結合，到建立桌球教練創業輔導的平台，甚至邀請名人一起玩桌球，越來越多的創意可能性等著我們去實現！</p>
              <p style={{fontSize:"20px",fontWeight:"900",color:"#1A1A1A",fontFamily:"Noto Sans TC",marginTop:16}}><span style={{fontFamily:"Futura"}}>Let's Play !</span> 運動 <span style={{fontFamily:"Futura"}}>X</span> 創新，邀請大家一起來玩！</p>
          </div>
      </div>
      <div style={{display:"flex",flexDirection:"row",alignItems:"center",justifyContent:"center",paddingLeft:"30px",paddingRight:"30px",marginBottom:120}}>
          <img src={about3} style={{width:207,height:370,marginRight:103}} alt="" />
          <div style={{display:"flex",flexDirection:"column",width:"680px"}}>
              <h2 style={{fontSize:"30px",fontWeight:"900",color:"#1A1A1A",fontFamily:"Noto Sans TC",margin:0}}>教學理念</h2>
              <h2  style={{fontSize:"26px",fontWeight:"700",color:"#1A1A1A",fontFamily:"Futura",fontStyle:"normal",marginTop:10,marginBottom:24}}>Let's Play Teach</h2>
              <p  style={{fontSize:"20px",fontWeight:"500",color:"#1A1A1A",fontFamily:"Noto Sans TC",margin:0,lineHeight:"36px",textAlign:"justify"}}>我我們有個小小的願望，就是和大家一起「玩」桌球，透過輕鬆玩，讓全身細胞體會動起來的暢快感!我們有個大大的夢想，藉由「玩」桌球，跨越單純的運動本身、與各種可能性結合，讓桌球走進你我的生活中，帶著爸爸、媽媽、阿公、阿嬤、叔叔、伯伯、阿姨、姑姑、哥哥、姊姊、弟弟、妹妹、朋友所有人一起 <span style={{fontFamily:"Futura"}}>Let's Play !</span></p>
          </div>
      </div>
 
    </Container>

    <MobileContainer>
      <AboutItems>
        <AboutText>關於我們</AboutText>
        <AboutUs>About Us</AboutUs>
      </AboutItems>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",paddingLeft:"30px",paddingRight:"30px",marginBottom:80}}>
          <img src={about1m} style={{width:"100%"}} alt="" />
          <div style={{display:"flex",flexDirection:"column"}}>
              <h2 style={{fontSize:"20px",fontWeight:"900",color:"#1A1A1A",fontFamily:"Noto Sans TC",margin:0,marginTop:20}}>我們的夢想</h2>
              <h2  style={{fontSize:"18px",fontWeight:"700",color:"#1A1A1A",fontFamily:"Futura",fontStyle:"normal",marginTop:10,marginBottom:20}}>Let's Play Dream</h2>
              <p  style={{fontSize:"16px",fontWeight:"500",color:"#1A1A1A",fontFamily:"Noto Sans TC",margin:0,lineHeight:"36px",textAlign:"justify"}}>我我們有個小小的願望，就是和大家一起「玩」桌球，透過輕鬆玩，讓全身細胞體會動起來的暢快感!我們有個大大的夢想，藉由「玩」桌球，跨越單純的運動本身、與各種可能性結合，讓桌球走進你我的生活中，帶著爸爸、媽媽、阿公、阿嬤、叔叔、伯伯、阿姨、姑姑、哥哥、姊姊、弟弟、妹妹、朋友所有人一起 <span style={{fontFamily:"Futura"}}>Let's Play !</span></p>
              <p style={{fontSize:"16px",fontWeight:"900",color:"#1A1A1A",fontFamily:"Noto Sans TC",marginTop:16}}>感受發自內心的快樂，一起來玩吧！</p>
          </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",paddingLeft:"30px",paddingRight:"30px",marginBottom:80}}>
          <img src={about2m} style={{width:"100%"}} alt="" />
          <div style={{display:"flex",flexDirection:"column"}}>
              <h2 style={{fontSize:"20px",fontWeight:"900",color:"#1A1A1A",fontFamily:"Noto Sans TC",margin:0,marginTop:20}}>我們的故事</h2>
              <h2  style={{fontSize:"18px",fontWeight:"700",color:"#1A1A1A",fontFamily:"Futura",fontStyle:"normal",marginTop:10,marginBottom:20}}>Let's Play Story</h2>
              <p  style={{fontSize:"16px",fontWeight:"500",color:"#1A1A1A",fontFamily:"Noto Sans TC",margin:0,lineHeight:"36px",textAlign:"justify"}}><span style={{fontFamily:"Futura"}}>Let's Play !</span> 創立於 <span style={{fontFamily:"Futura"}}>2018</span> 年，創辦人阿寬教練畢業於桌球名校麗山國中與松山家商，大學時期深受林學宜教授的啟發，非常懂得職業球員訓練的辛苦，但他其實更想分享給大家的是，如何和大家快樂的「玩」桌球！孩子可以培養信心與專注力、上班族可以釋放壓力、年長者可以擁有豐富退休生活的樂趣!</p>
              <p style={{fontSize:"16px",fontWeight:"500",color:"#1A1A1A",fontFamily:"Noto Sans TC",margin:0,lineHeight:"36px",textAlign:"justify"}}>此外，從桌球同業的夥伴聯盟合作與跨領域的異業結合，到建立桌球教練創業輔導的平台，甚至邀請名人一起玩桌球，越來越多的創意可能性等著我們去實現！</p>
              <p style={{fontSize:"16px",fontWeight:"900",color:"#1A1A1A",fontFamily:"Noto Sans TC",marginTop:8}}><span style={{fontFamily:"Futura"}}>Let's Play !</span> 運動 <span style={{fontFamily:"Futura"}}>X</span> 創新，邀請大家一起來玩！</p>
          </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",paddingLeft:"30px",paddingRight:"30px",marginBottom:80}}>
          <img src={about3m} style={{width:"100%"}} alt="" />
          <div style={{display:"flex",flexDirection:"column"}}>
              <h2 style={{fontSize:"20px",fontWeight:"900",color:"#1A1A1A",fontFamily:"Noto Sans TC",margin:0,marginTop:20}}>教學理念</h2>
              <h2  style={{fontSize:"18px",fontWeight:"700",color:"#1A1A1A",fontFamily:"Futura",fontStyle:"normal",marginTop:10,marginBottom:20}}>Let's Play Teach</h2>
              <p  style={{fontSize:"16px",fontWeight:"500",color:"#1A1A1A",fontFamily:"Noto Sans TC",margin:0,lineHeight:"36px",textAlign:"justify"}}>我我們有個小小的願望，就是和大家一起「玩」桌球，透過輕鬆玩，讓全身細胞體會動起來的暢快感!我們有個大大的夢想，藉由「玩」桌球，跨越單純的運動本身、與各種可能性結合，讓桌球走進你我的生活中，帶著爸爸、媽媽、阿公、阿嬤、叔叔、伯伯、阿姨、姑姑、哥哥、姊姊、弟弟、妹妹、朋友所有人一起 <span style={{fontFamily:"Futura"}}>Let's Play !</span></p>
          </div>
      </div>



    </MobileContainer>



  </PageContainer>;
};

export default About;
