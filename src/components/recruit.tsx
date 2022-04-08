import React from "react";
import styled from "styled-components";
import colorcircle from "../assets/recruit/colorCircle.png";


// styled components start 

const PageContainer = styled.div`
  height: 100vh;
  width:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const ColorcircleImg = styled.img`
  width: 580px;
  height:294px;

`;

const Container = styled.div`
  display:flex;
  justify-content:center;
  margin-top:100px;
`;


/* desktop thw newest info style end */
const Recruit = () => {
  return <PageContainer>
    <Container>
      <ColorcircleImg src={colorcircle} alt="" />
      <div>
        <div>
          <p>＃ 熱烈招募中！</p>
        </div>
        <p>
          ・ 讓雙北小朋友有更完善的學習資源<br />
          ・ 推廣桌球讓更多成人共同參與<br />
        </p>

        <p>
          ・ 除館內課程推出也提供外派教練進駐服務<br />
          ・ 補習班 / 幼兒園 / 學校社團<br />
          ・ 家裡 / 運動中心 / 公司社團 / 公家機構<br />
          ・ 休閒運動體系創新合作教案（歡樂 / 技術）<br />
          ・ 公司福委會競技休閒活動
        </p>

        <p>
          ・ 期望結合不同類別才藝發展多元課程<br />
          街舞、兒童舞蹈、畫畫、音樂等
        </p>

        <p>
          ・ 桌球趣味比賽協辦<br />
          ・ 乒乓球表演者<br />
          ・ 提供桌球產業教練獨特升遷制度
        </p>
      </div>
    </Container>

  </PageContainer>;
};

export default Recruit;
