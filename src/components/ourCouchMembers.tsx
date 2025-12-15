import React from "react";
import styled from "styled-components";

type CoachSection = {
  title: string;
  items: string[];
};

type Coach = {
  name: string;
  nickname?: string;
  sections: CoachSection[];
};

const COACHES: Coach[] = [
  {
    name: "郭則寬",
    nickname: "阿寬",
    sections: [
      {
        title: "教練歷程",
        items: ["華江高中運動中心", "台北市民權國小", "現任 Let’s Play 執行長"],
      },
      {
        title: "學習歷程",
        items: ["麗山國中體育班", "松山家商體育班", "宜蘭大學休閒產業與健康促進學系"],
      },
      {
        title: "比賽成績",
        items: [
          "全國自由杯錦標賽高中團體第五名",
          "中港澳臺兩岸四地交流賽單打第三名",
          "全國大專院校公開組團體第八名",
        ],
      },
      {
        title: "帶隊成績",
        items: ["國泰陳慈庭 104 年 15 歲青少年國手第 10 名", "105 年 15 歲青少年國手第 5 名", "107 年 18 歲青少年國手第 10 名"],
      },
      {
        title: "證照",
        items: ["C 級桌球教練證照", "B 級桌球教練證照", "C 級桌球裁判證照", "中華民國體適能協會健身指導員 C 級"],
      },
      {
        title: "教學特色",
        items: ["透過引導教學方式，讓不管是大學員小學員，皆能夠快速上手桌球。"],
      },
    ],
  },
  {
    name: "林培中",
    nickname: "派派",
    sections: [
      {
        title: "教練歷程",
        items: ["102 年桌球助理指導教練受邀請至中天新聞與記者對打", "105 年 7、8 月桌球校隊助理教練擔任雨農國小桌球校隊培訓員", "109 年 12 月至 7 月擔任華江高中校隊培訓員"],
      },
      {
        title: "學習歷程",
        items: ["台北市麗山國中", "臺北市立松山高商", "國立宜蘭大學休閒系學士學位"],
      },
      {
        title: "比賽成績",
        items: ["全國自由盃社男甲組團體第二名", "宜蘭縣桌球錦標賽團體冠軍", "全國大專院校運動會甲組團體第八名"],
      },
      {
        title: "證照",
        items: ["C 級桌球教練證照"],
      },
      {
        title: "教學特色",
        items: ["教學生動活潑，親和力十足。", "因應學員程度不同，給予適合的教學課程。"],
      },
    ],
  },
  {
    name: "楊秉翰",
    nickname: "羊羊",
    sections: [
      {
        title: "學習歷程",
        items: ["新莊國中體育班", "長榮中學體育班", "國立體育大學球類系"],
      },
      {
        title: "教學特色",
        items: ["透過遊戲讓學員產生興趣以及學習相關技術。", "靈活應對不同學習需求，並調整教學內容。"],
      },
      {
        title: "教學相關歷程",
        items: ["台南小霸王乒乓世界", "台南崇學國小", "台北雨農國小", "新北路亞實驗小學社團", "Let’s Play（過往任教）"],
      },
      {
        title: "比賽成績",
        items: ["自由盃高中團體第五"],
      },
      {
        title: "證照",
        items: ["中華桌協 C 級教練"],
      },
    ],
  },
  {
    name: "黃兆銨",
    nickname: "小銨",
    sections: [
      {
        title: "學習歷程",
        items: ["桃園永豐高中桌球隊", "國立台北教育大學體育系師資生"],
      },
      {
        title: "服務資歷",
        items: ["桃園市 文山國小桌球社團教練", "桃園市 中正國小桌球社團教練", "桃園市 桃園國中桌球社團教練", "桃園市 永豐高中桌球社團教練", "1v1 個別教練"],
      },
      {
        title: "教學理念",
        items: ["學得開心，對打球更有信心"],
      },
      {
        title: "比賽成績",
        items: [
          "全國國語日報盃高年級團體季軍",
          "全國國小觀音盃殿軍",
          "桃園市市長盃高中團體亞軍",
          "桃園市市長盃社會團體季軍",
          "全國中等學校運動會高中團體第五名",
        ],
      },
      {
        title: "教學特色",
        items: ["利用小口訣、遊戲的方式讓學生喜歡桌球，並用有耐心、細心的教學模式對待學生，讓學生更輕鬆學桌球。"],
      },
    ],
  },
  {
    name: "王韻涵",
    nickname: "Amber",
    sections: [
      {
        title: "學習歷程",
        items: ["新北市新興國小桌球隊畢業生", "苗栗縣維真國中體育班", "苗栗縣大同高中體育班", "國立體育大學球類系"],
      },
      {
        title: "教學特色",
        items: ["培養學生興趣，激起學生對運動的熱忱並開心運動。", "擅長以簡單易懂的教學模式，使學員能輕鬆學習基礎技巧與桌球知識。"],
      },
      {
        title: "教學相關歷程",
        items: ["Let's Play 蘆洲店", "雲林大埤國小桌球隊", "桃園大業國小桌球隊", "新北厚德國小桌球隊"],
      },
      {
        title: "比賽成績",
        items: ["110 全國中等學校運動會團體冠軍", "111 全國中等學校運動會團體亞軍", "112 全國中等學校運動會女雙亞軍"],
      },
    ],
  },
  {
    name: "蔡鎮宇",
    nickname: "小蔡",
    sections: [
      {
        title: "教練資料",
        items: ["資料更新中。"],
      },
    ],
  },
  {
    name: "溫達威",
    nickname: "威廉",
    sections: [
      {
        title: "學習歷程",
        items: ["元生國小體育班", "內壢國中體育班", "臺灣師範大學體育系"],
      },
      {
        title: "比賽成績",
        items: ["桃園市市長盃團體亞軍", "積分賽 2200 分以下冠軍／亞軍／季軍皆有"],
      },
      {
        title: "教學特色",
        items: ["透過耐心及基本動作的磨練及目標達成，能讓學生更容易上手，和其他項目的特色差異，並且從中感到成就感，引發主動學習動機！"],
      },
    ],
  },
];

const PageContainer = styled.div`
  width: 100%;
  box-sizing: border-box;
  padding: 80px 24px;
  overflow-x: hidden;
`;

const Grid = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;

  @media screen and (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const Card = styled.div`
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  min-width: 0;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const Avatar = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: #f5f6f6;
  color: #1a1a1a;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: "Noto Sans TC";
  font-weight: 900;
  font-size: 18px;
  flex: 0 0 auto;
`;

const Name = styled.div`
  font-family: "Noto Sans TC";
  font-weight: 900;
  font-size: 20px;
  line-height: 28px;
  color: #1a1a1a;
`;

const Nickname = styled.div`
  font-family: "Noto Sans TC";
  font-weight: 500;
  font-size: 14px;
  line-height: 22px;
  color: #3c3d3d;
  margin-top: 2px;
`;

const SectionTitle = styled.div`
  font-family: "Noto Sans TC";
  font-weight: 900;
  font-size: 14px;
  line-height: 22px;
  color: #005cb9;
  margin-top: 12px;
  margin-bottom: 6px;
`;

const List = styled.ul`
  margin: 0;
  padding-left: 18px;
`;

const ListItem = styled.li`
  font-family: "Noto Sans TC";
  font-weight: 400;
  font-size: 14px;
  line-height: 24px;
  color: #1a1a1a;
  word-break: break-word;
`;

const OurCouchMembers = () => {
  return (
    <PageContainer id="ourCouchMembers">
      <Grid>
        {COACHES.map((coach) => (
          <Card key={coach.name}>
            <Header>
              <Avatar aria-hidden>{coach.name.slice(0, 1)}</Avatar>
              <div>
                <Name>{coach.name}</Name>
                {coach.nickname ? <Nickname>（{coach.nickname}）</Nickname> : null}
              </div>
            </Header>

            {coach.sections.map((section) => (
              <div key={`${coach.name}-${section.title}`}>
                <SectionTitle>{section.title}</SectionTitle>
                <List>
                  {section.items.map((item) => (
                    <ListItem key={`${coach.name}-${section.title}-${item}`}>{item}</ListItem>
                  ))}
                </List>
              </div>
            ))}
          </Card>
        ))}
      </Grid>
    </PageContainer>
  );
};

export default OurCouchMembers;
