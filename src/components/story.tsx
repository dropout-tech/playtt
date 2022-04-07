import React from "react";
import styled from "styled-components";
import colorpic from "../assets/story/colorpic.png";



// styled components start 

const PageContainer = styled.div`
  height: 100vh;
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const ColorpicImg = styled.img`
  width:517px ;
  height:517px ;
  margin-left:100px;

`;

const Container = styled.div`
 width:100% ;
 height:920px;
`;

const Picture = styled.div`
  width:50%;
  display:flex;
  justify-content:flex-end;


`;

const Text = styled.p`
  width:50%;
  display:flex;
  justify-content:flex-start;

`;

const Title1 = styled.p`
  

`;

const Title2 = styled.p`
  

`;

const Title3 = styled.p`
  

`;

const Title4 = styled.p`
  

`;

const Contant = styled.p`

`;






/* desktop thw newest info style end */
const Story = () => {
  return <PageContainer>

    <Picture>
      <ColorpicImg src={colorpic} alt="" />
    </Picture>

    <Text>
      <div>
        <Title1></Title1>
        <Title2></Title2>
        <Contant></Contant>
      </div>

      <div>
        <Title3></Title3>
        <Title4></Title4>
      </div>
    </Text>





  </PageContainer>;
};

export default Story;
