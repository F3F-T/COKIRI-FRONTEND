import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import styles from "../styles/loginAndSignup/MyPage.module.css";
import { useLocation, useNavigate } from "react-router-dom";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import photo from "../img/photoSelect.png";
import PriceBox from "../component/trade/PriceBox";
import profile from "../img/profile.jpeg";
import PostContainer from "../component/trade/PostContainer";
import MyPageSet from "../component/MyPageSet";
import Card from "../component/tradeCard/Card";
import Api from "../utils/api";

interface PostType {
  content: [
    {
      postId?: number;
      title?: string;
      thumbNail?: string;
      scrapCount: number;
      tradeStatus: string;
      wishCategory?: string;
    }
  ];
}
const MyPageZZIM = () => {
  const [tab1, setTab] = useState("curr");
  const [scrapList, setScrapList] = useState<PostType[]>(null);
  const { state } = useLocation(); //다른 유저꺼 받을 때

  function setDealTab(tab) {
    setTab(tab);
    console.log(tab1);
  }
  const navigate = useNavigate();
  async function getMySrapPostList() {
    try {
      const res = await Api.get("/user/scrap");
      setScrapList((prevState) => {
        return [...res.data.content];
      });
    } catch (err) {
      console.log(err);
      alert("내 스크랩 불러오기 실패");
    }
  }

  useEffect(() => {
    getMySrapPostList();
  }, []);
  if (!scrapList) {
    return null;
  }
  const onClickPost = (post) => {
    navigate(`/post/${post.postId}`);
  };
  return (
    <>
      <div className={styles.MyPage}>
        <div className={styles.container}>
          {scrapList.reverse().map((SingleObject: Object) => (
            <Card
              className={"forMypage"}
              thumbnail={SingleObject["thumbNail"]}
              postTitle={SingleObject["title"]}
              like={SingleObject["scrapCount"]}
              wishCategory={SingleObject["wishCategory"]}
              onClick={() => {
                onClickPost(SingleObject);
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default MyPageZZIM;
