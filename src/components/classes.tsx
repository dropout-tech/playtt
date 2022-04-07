import React from "react";
import styled from "styled-components";

const PageContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const Container = styled.div`
  width:100%;
`;


const ClassIntroduce = styled.div`

`;

const Title1 = styled.p`
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-size: 36px;
  line-height: 52px;
  text-align: center;
  letter-spacing: 0.04em;
  color: #1A1A1A;
`;

const Title2 = styled.p`
  font-family: 'Futura';
  font-style: normal;
  font-weight: 700;
  font-size: 36px;
  line-height: 48px;
  text-align: center;
  letter-spacing: 0.04em;
  color: #CFD2D3;
`;


/* desktop thw newest info style end */
const Classes = () => {
  return <PageContainer>
    <Container>

      <ClassIntroduce>
        <Title1>課程介紹</Title1>
        <Title2>Our Class</Title2>
      </ClassIntroduce>

      <div></div>



    </Container>


  </PageContainer>;
};

export default Classes;
