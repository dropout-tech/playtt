import React from "react";
import styled from "styled-components";
import img1 from "../assets/ourCouchMenber/img1.png";
import img2 from "../assets/ourCouchMenber/img2.png";
import img3 from "../assets/ourCouchMenber/img3.png";
import img4 from "../assets/ourCouchMenber/img4.png";
import img5 from "../assets/ourCouchMenber/img5.png";
import img6 from "../assets/ourCouchMenber/img6.png";
import img7 from "../assets/ourCouchMenber/img7.png";
import img8 from "../assets/ourCouchMenber/img8.png";
import img11 from "../assets/ourCouchMenber/img-1.png";
import img22 from "../assets/ourCouchMenber/img-2.png";
import img33 from "../assets/ourCouchMenber/img-3.png";
import img44 from "../assets/ourCouchMenber/img-4.png";
import img55 from "../assets/ourCouchMenber/img-5.png";
import img66 from "../assets/ourCouchMenber/img-6.png";
import img77 from "../assets/ourCouchMenber/img-7.png";
import img88 from "../assets/ourCouchMenber/img-8.png";

// styled components start

const PageContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  @media screen and (max-width: 768px) {
  }
`;

const Container = styled.div`
  padding-top: 80px;
  padding-bottom: 80px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: -65px;

  @media screen and (max-width: 768px) {
    display: none;
  }
`;

const PicImg = styled.img`
  width: 310px;
  height: 300px;
  margin-left: 80px;
  @media screen and (max-width: 768px) {
    width: 211px;
    height: 201px;
  }
`;

const Row1 = styled.div`
  display: flex;
  justify-content: center;
  margin-top: -65px;
  @media screen and (max-width: 768px) {
    display: flex;
    justify-content: center;
    flex-direction: column;
  }
`;

const Row2 = styled.div`
  display: flex;
  flex-direction: row;
  margin-top: 50px;
  justify-content: center;
  align-items: center;
  @media screen and (max-width: 768px) {
  }
`;

const Row3 = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: row;
  margin-top: 50px;
  margin-bottom: 94px;
  @media screen and (max-width: 768px) {
  }
`;

const Picture = styled.div`
  width: 100%;

  @media screen and (max-width: 768px) {
    display: none;
  }
`;

const MobileContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 17px;

  @media screen and (min-width: 768px) {
    display: none;
  }
`;

const Text = styled.p`
  margin-left: 150px;
  font-family: "Noto Sans TC";
  font-style: normal;
  font-weight: 900;
  font-size: 26px;
  line-height: 40px;
  display: flex;
  align-items: center;
  letter-spacing: 0.04em;
  color: #1a1a1a;
  @media screen and (max-width: 768px) {
    margin-left: 0px;
    display: flex;
    flex-direction: column;
    margin-right: 100px;
    font-family: "Noto Sans TC";
    font-style: normal;
    font-weight: 900;
    font-size: 20px;
    line-height: 36px;
    display: flex;
    justify-content: center;
    align-items: center;
    letter-spacing: 0.03em;
    color: #1a1a1a;
  }
`;

const TextEVA = styled.p`
  margin-left: 10px;
  font-family: "Noto Sans TC";
  font-style: normal;
  font-weight: 900;
  font-size: 26px;
  line-height: 40px;
  display: flex;
  align-items: center;
  letter-spacing: 0.04em;
  color: #1a1a1a;
  margin-left: 170px;
  @media screen and (max-width: 768px) {
    margin: 0px;
    display: flex;
    flex-direction: column;
    font-family: "Noto Sans TC";
    font-style: normal;
    font-weight: 900;
    font-size: 20px;
    line-height: 36px;
    display: flex;
    align-items: center;
    letter-spacing: 0.03em;
    color: #1a1a1a;
  }
`;

const Text2 = styled.p`
  margin-left: 200px;
  font-family: "Noto Sans TC";
  font-style: normal;
  font-weight: 900;
  font-size: 26px;
  line-height: 40px;
  display: flex;
  align-items: center;
  letter-spacing: 0.04em;
  color: #1a1a1a;
  margin-left: 150px;
  @media screen and (max-width: 768px) {
    margin-left: 0px;
    display: flex;
    flex-direction: column;
    font-family: "Noto Sans TC";
    font-style: normal;
    font-weight: 900;
    font-size: 20px;
    line-height: 36px;
    display: flex;
    justify-content: center;
    align-items: center;
    letter-spacing: 0.03em;
    color: #1a1a1a;
  }
`;

const Span = styled.span`
  font-family: "Noto Sans TC";
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 32px;
  display: flex;
  align-items: center;
  letter-spacing: 0.04em;
  color: #1a1a1a;
  margin-left: 10px;
  @media screen and (max-width: 768px) {
    font-family: "Futura";
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 30px;
    display: flex;
    align-items: flex-start;
    letter-spacing: 0.02em;
    color: #1a1a1a;
    width: 100px;
    margin-left: 60px;
  }
`;

const ContentText = styled.p`
  font-family: "Noto Sans TC";
  font-style: normal;
  font-weight: 400;
  font-size: 15px;
  margin: 0;
  @media screen and (max-width: 768px) {
    font-size: 12px;
    margin-top:3px;

  }

`

const Span3 = styled.span`
  font-family: "Noto Sans TC";
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 32px;
  display: flex;
  align-items: center;
  letter-spacing: 0.04em;
  color: #1a1a1a;
  margin-left: -2px;
  @media screen and (max-width: 768px) {
    font-family: "Futura";
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 30px;
    display: flex;
    align-items: flex-start;
    letter-spacing: 0.02em;
    color: #1a1a1a;
    width: 100px;
    margin-left: 60px;
  }
`;

const Couch = styled.div`
  margin-left: 50px;
`;

const SpanEVA = styled.span`
  font-family: "Futura";
  font-weight: 500;
  font-size: 20px;
  line-height: 36px;
  letter-spacing: 3%;
  margin-left: 10px;
`;

const Members = styled.div`
  @media screen and (max-width: 768px) {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    margin-top: 20px;
  }
`;
const Members2 = styled.div`
  @media screen and (max-width: 768px) {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    margin-top: 20px;
  }
`;

const MemberNameLeft = styled.p`
  @media screen and (max-width: 768px) {
    margin: 0;
    font-family: "Noto Sans TC";
    font-weight: 900;
    font-size: 20px;
    line-height: 36px;
    letter-spacing: 3%;
    color: #1a1a1a;
    display: flex;
    justify-content: flex-start;
  }
`;

const MemberNameRight = styled.p`
  @media screen and (max-width: 768px) {
    margin: 0;
    font-family: "Noto Sans TC";
    font-weight: 900;
    font-size: 20px;
    line-height: 36px;
    letter-spacing: 3%;
    color: #1a1a1a;
    display: flex;
    justify-content: flex-end;
  }
`;

const NickName = styled.p`
  @media screen and (max-width: 768px) {
    font-family: "Noto Sans TC";
    font-weight: 500;
    font-size: 16px;
    line-height: 30px;
    letter-spacing: 0.02em;
    color: #1a1a1a;
    margin: 0;
  }
`;

const SpanEva = styled.span`
  @media screen and (max-width: 768px) {
    margin: 0;
    font-family: "Futura";
    font-weight: 500;
    font-size: 16px;
    line-height: 30px;
    letter-spacing: 2%;
    color: #1a1a1a;
  }
`;

const NameComponentLeft = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 20px;
`;

const NameComponentRight = styled.div`
  display: flex;
  flex-direction: column;
  margin-right: 20px;
`;

const MemberPic = styled.img`
  width: 211px;
  height: 201px;
`;

const PictureContainer = styled.div`
  @media screen and (max-width: 768px) {
    width: 90%;
  }
`;

/* desktop thw newest info style end */
const OurCouchMembers = () => {
  return (
    <PageContainer id="ourCouchMembers">
      <Container>
        <Picture>
          <Row1>
            <Couch>
              <PicImg src={img1} alt="" />
              <TextEVA>
                呂昀
                <Span3>
                  <SpanEVA>Eva</SpanEVA> 教練
                </Span3>
              </TextEVA>
              <div style={{ width: 200, marginLeft: 170, marginTop: -20 }}>
                <ContentText>
                  · 教學經驗5年
                </ContentText>
                <div style={{ display: "flex", marginTop: 5 }}>
                  <ContentText>
                    · 特色：
                  </ContentText>
                  <div>
                    <ContentText>溫柔與嚴格併行</ContentText>
                    <ContentText>朋友般的親和互動</ContentText>
                    <ContentText>幼幼/親子班指定</ContentText>
                  </div>
                </div>
              </div>
            </Couch>

            <Couch>
              <PicImg src={img2} alt="" />
              <Text>
                温達威<Span>威廉教練</Span>
              </Text>
              <div style={{ width: 200, marginLeft: 150, marginTop: -20 }}>
                <ContentText>
                  · 教學經驗3年
                </ContentText>
                <div style={{ display: "flex", marginTop: 5 }}>
                  <ContentText>
                    · 特色：
                  </ContentText>
                  <div>
                    <ContentText>耐心使人易上手</ContentText>
                    <ContentText>引發主動學習</ContentText>
                    <ContentText>兒童團體指定</ContentText>
                  </div>
                </div>
              </div>

            </Couch>

            <Couch>
              <PicImg src={img3} alt="" />
              <Text>
                林培中<Span>派派教練</Span>
              </Text>
              <div style={{ width: 200, marginLeft: 150, marginTop: -20 }}>
                <ContentText>
                  · 教學經驗7年
                </ContentText>
                <div style={{ display: "flex", marginTop: 5 }}>
                  <ContentText>
                    · 特色：
                  </ContentText>
                  <div>
                    <ContentText>教學生動活潑</ContentText>
                    <ContentText>親和力十足</ContentText>
                    <ContentText>啟蒙與小選手培訓</ContentText>
                  </div>
                </div>
              </div>
            </Couch>
          </Row1>

          <Row2>
            <Couch>
              <PicImg src={img4} alt="" />
              <Text2>
                郭則寬<Span>阿寬教練</Span>
              </Text2>
              <div style={{ width: 200, marginLeft: 150, marginTop: -20 }}>
                <ContentText>
                  · 教學經驗10年
                </ContentText>
                <div style={{ display: "flex", marginTop: 5 }}>
                  <ContentText>
                    · 特色：
                  </ContentText>
                  <div>
                    <ContentText>引導式教學</ContentText>
                    <ContentText>全年齡快速上手</ContentText>
                    <ContentText>成人團體與企業合作</ContentText>
                  </div>
                </div>
              </div>
            </Couch>

            <Couch>
              <PicImg src={img5} alt="" />
              <Text2>
                林晏先<Span>先先教練</Span>
              </Text2>
              <div style={{ width: 200, marginLeft: 150, marginTop: -20 }}>
                <ContentText>
                  · 教學經驗3年
                </ContentText>
                <div style={{ display: "flex", marginTop: 5 }}>
                  <ContentText>
                    · 特色：
                  </ContentText>
                  <div>
                    <ContentText>遊戲方式教學</ContentText>
                    <ContentText>引導小朋友喜愛桌球</ContentText>
                    <ContentText>兒童團體班指定</ContentText>
                  </div>
                </div>
              </div>
            </Couch>
          </Row2>

          <Row3>
            <Couch>
              <PicImg src={img6} alt="" />
              <Text>
                顏兆寅<Span>小顏教練</Span>
              </Text>
              <div style={{ width: 200, marginLeft: 150, marginTop: -20 }}>
                <ContentText>
                  · 教學經驗10年
                </ContentText>
                <div style={{ display: "flex", marginTop: 5 }}>
                  <ContentText>
                    · 特色：
                  </ContentText>
                  <div>
                    <ContentText>全年齡皆可</ContentText>
                    <ContentText>細心、耐心、責任心</ContentText>
                    <ContentText>休閒與小小選手指定</ContentText>
                  </div>
                </div>
              </div>
            </Couch>

            <Couch>
              <PicImg src={img7} alt="" />
              <Text>
                林政蔚<Span>政蔚教練</Span>
              </Text>
              <div style={{ width: 200, marginLeft: 150, marginTop: -20 }}>
                <ContentText>
                  · 教學經驗10年
                </ContentText>
                <div style={{ display: "flex", marginTop: 5 }}>
                  <ContentText>
                    · 特色：
                  </ContentText>
                  <div>
                    <ContentText>學習中培養信心</ContentText>
                    <ContentText>引發終身學習</ContentText>
                    <ContentText>成人團體與企業合作</ContentText>
                  </div>
                </div>
              </div>
            </Couch>

            <Couch>
              <PicImg src={img8} alt="" />
              <Text>
                夏振凱<Span>凱凱教練</Span>
              </Text>
              <div style={{ width: 210, marginLeft: 150, marginTop: -20 }}>
                <ContentText>
                  · 教學經驗4年
                </ContentText>
                <div style={{ display: "flex", marginTop: 5 }}>
                  <ContentText style={{width:67}}>
                    · 特色：
                  </ContentText>
                  <div>
                    <ContentText>學習失敗中成長</ContentText>
                    <ContentText>學習態度與品行教育</ContentText>
                    <ContentText>兒童個人/團體班指定</ContentText>
                  </div>
                </div>
              </div>
            </Couch>
          </Row3>
        </Picture>
      </Container>

      <MobileContainer>
        <PictureContainer>
          <Members>
            <MemberPic src={img11} alt="" />
            <NameComponentLeft>
              <MemberNameLeft>呂昀</MemberNameLeft>
              <NickName>
                <SpanEva>Eva </SpanEva>教練
              </NickName>
              <div>
                <ContentText>
                  教學經驗5年
                </ContentText>
                <ContentText>溫柔與嚴格併行</ContentText>
                <ContentText>朋友般的親和互動</ContentText>
                <ContentText>幼幼/親子班指定</ContentText>
              </div>
            </NameComponentLeft>
          </Members>

          <Members2>
            <NameComponentRight style={{textAlign:"right"}}>
              <MemberNameRight>温達威</MemberNameRight>
              <NickName>威廉教練</NickName>
              <div>
                <ContentText>
                  教學經驗3年
                </ContentText>
                <ContentText>耐心使人易上手</ContentText>
                <ContentText>引發主動學習</ContentText>
                <ContentText>兒童團體指定</ContentText>
              </div>
            </NameComponentRight>
            <MemberPic src={img22} alt="" />
          </Members2>

          <Members>
            <MemberPic src={img33} alt="" />
            <NameComponentLeft>
              <MemberNameLeft>林培中</MemberNameLeft>
              <NickName>派派教練</NickName>
              <div>
                <ContentText>
                  教學經驗7年
                </ContentText>
                <ContentText>教學生動活潑</ContentText>
                <ContentText>親和力十足</ContentText>
                <ContentText>啟蒙與小選手培訓</ContentText>
              </div>
            </NameComponentLeft>
          </Members>

          <Members2>
            <NameComponentRight style={{textAlign:"right"}}>
              <MemberNameRight>郭則寬</MemberNameRight>
              <NickName>阿寬教練</NickName>
              <div>
                <ContentText>
                  教學經驗10年
                </ContentText>
                <ContentText>引導式教學</ContentText>
                <ContentText>全年齡快速上手</ContentText>
                <ContentText>成人團體與企業合作</ContentText>
              </div>
            </NameComponentRight>
            <MemberPic src={img44} alt="" />
          </Members2>

          <Members>
            <MemberPic src={img55} alt="" />
            <NameComponentLeft>
              <MemberNameLeft>林晏先</MemberNameLeft>
              <NickName>先先教練</NickName>
              <div>
                <ContentText>
                  教學經驗3年
                </ContentText>
                <ContentText>遊戲方式教學</ContentText>
                <ContentText>引導小朋友喜愛桌球</ContentText>
                <ContentText>兒童團體班指定</ContentText>
              </div>
            </NameComponentLeft>
          </Members>

          <Members2>
            <NameComponentRight style={{textAlign:"right"}}>
              <MemberNameRight>顏兆寅</MemberNameRight>
              <NickName>小顏教練</NickName>
              <div>
                <ContentText>
                  教學經驗10年
                </ContentText>
                <ContentText>全年齡皆可</ContentText>
                <ContentText>細心、耐心、責任心</ContentText>
                <ContentText>休閒與小小選手指定</ContentText>
              </div>
            </NameComponentRight>
            <MemberPic src={img66} alt="" />
          </Members2>

          <Members>
            <MemberPic src={img77} alt="" />
            <NameComponentLeft>
              <MemberNameLeft>林政蔚</MemberNameLeft>
              <NickName>政蔚教練</NickName>
              <div>
                <ContentText>
                  教學經驗10年
                </ContentText>
                <ContentText>學習中培養信心</ContentText>
                <ContentText>引發終身學習</ContentText>
                <ContentText>成人團體與企業合作</ContentText>
              </div>
            </NameComponentLeft>
          </Members>

          <Members2>
            <NameComponentRight style={{textAlign:"right"}}>
              <MemberNameRight>夏振凱</MemberNameRight>
              <NickName>凱凱教練</NickName>
              <div>
                <ContentText>
                  教學經驗4年
                </ContentText>
                <ContentText>學習失敗中成長</ContentText>
                <ContentText>學習態度與品行教育</ContentText>
                <ContentText>兒童個人/團體班指定</ContentText>
              </div>
            </NameComponentRight>
            <MemberPic src={img88} alt="" />
          </Members2>
        </PictureContainer>
      </MobileContainer>
    </PageContainer>
  );
};

export default OurCouchMembers;
