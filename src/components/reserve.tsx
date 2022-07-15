import React from "react";
import styled from "styled-components";




// styled components start 

const PageContainer = styled.div`
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
   @media screen and (max-width: 768px) {
    
  }
`;

const Container = styled.div`
  /* margin-top:-10px;
  padding-top:60px;
  padding-bottom:40px; */
   @media screen and (max-width: 768px) {
    /* margin-top:-50px;
    padding-bottom:0px;
    width:100%; */
  }

   @media screen and (max-width: 768px) {
     display:none
  }
`;

const MobileContainer = styled.div`
   margin-bottom:80px;
   @media screen and (min-width: 768px) {
     display:none
  }
`;

/* desktop thw newest info style end */
const Reserve = () => {
  return <PageContainer id="reserve">
    <Container>
    <div style={{display:"flex",flexDirection:"row",justifyContent:"center",marginTop:160}}>
      <div style={{display:"flex",flexDirection:"column",background:"#F5F6F6",height:284,width:"80%",justifyContent:"center",alignItems:"center"}}>
          <button style={{border:"none",background:"#38D430",width:374,height:72,fontSize:"26px",fontWeight:"900",color:"white",fontFamily:"Noto Sans TC"}} onClick={()=>{
            window.open("https://www.facebook.com/playpp2018","_parent")
          }}>
            立即預約免費試上
          </button>
          <p style={{margin:0,marginTop:20,fontSize:"18px",fontWeight:"500",fontFamily:"Noto Sans TC"}}>統一由臉書私訊洽詢想預約試上的分店 Line</p>
      </div>
    </div>
    </Container>
    <MobileContainer>
    <div style={{display:"flex",flexDirection:"row",justifyContent:"center"}}>
      <div style={{display:"flex",flexDirection:"column",background:"#F5F6F6",height:284,width:"100%",justifyContent:"center",alignItems:"center"}}>
          <button style={{border:"none",background:"#38D430",width:211,height:48,fontSize:"18px",fontWeight:"900",color:"white",fontFamily:"Noto Sans TC"}} onClick={()=>{
            window.open("https://www.facebook.com/playpp2018","_parent")
          }}>
            立即預約免費試上
          </button>
          <p style={{margin:0,marginTop:20,fontSize:"14px",fontWeight:"500",fontFamily:"Noto Sans TC"}}>統一由臉書私訊洽詢想預約試上的分店 Line</p>
      </div>
    </div>
    </MobileContainer>
  </PageContainer>;
};

export default Reserve;
