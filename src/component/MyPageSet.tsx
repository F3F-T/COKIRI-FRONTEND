import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "../styles/loginAndSignup/MyPage.module.css";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import setting from "../img/setting.png";
import axios from "axios";
import Api from "../utils/api";
import { useDispatch, useSelector } from "react-redux";
import { Rootstate } from "../index";
import { Simulate } from "react-dom/test-utils";
import { logoutUserInfo, setUserProfile } from "../store/userInfoReducer";
import { logoutToken } from "../store/jwtTokenReducer";
import { resetaddress1, resetaddress2 } from "../store/userAddressInfoReducer";
import { resetTalkCard } from "../store/talkCardReducer";
import SettingModal from "../routes/로그인 & 회원가입/SettingModal";
import input = Simulate.input;
import toastMsg from "../styles/Toast";

const MyPage = () => {
  interface UserInfo {
    userId: number;
    newNickname: string;
  }

  interface OtherUserInfo {
    otherUserNick: string;
    otherUserProfile: string;
    otherUserAddress: string;
  }

  type checkNicknameTypes = "invalid" | "valid" | "duplicated";
  const [tab1, setTab] = useState<string>("next");
  const [otherUser, setOtherUser] = useState<OtherUserInfo>({
    otherUserNick: "",
    otherUserProfile: "",
    otherUserAddress: "",
  });

  function setDealTab(tab) {
    setTab(tab);
  }

  const store = useSelector((state: Rootstate) => state);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const info = useSelector((state: Rootstate) => {
    return state.userInfoReducer;
  });
  const [userInfo, setuserInfo] = useState<UserInfo>(null);

  const params = useParams();
  let paramsId = parseInt(params.id);

  const { state } = useLocation(); //다른 유저꺼 받을 때

  useEffect(() => {
    if (paramsId != info.id) {
      getOtherUserProfile();
    }
  }, []);

  useEffect(() => {
    if (paramsId != info.id) {
      getOtherUserPostList();
    }
  }, []);

  useEffect(() => {
    if (paramsId === info.id) {
      getMyPostList();
    }
  }, []);
  useEffect(() => {
    if (paramsId === info.id) {
      readNickName();
    }
  }, []);
  useEffect(() => {
    if (state && state.m) {
      setOpenModal(true);
    }
  }, [state]);
  const [newNick, setNewNick] = useState(info.nickname);
  const [postNum, setNum] = useState<number>(0);
  const [otherpostNum, setotherNum] = useState<number>(0);
  const [tradedNum, setTradedNum] = useState();
  const [menuNum, setMenuNum] = useState<number>(1);

  //모달창
  const [isOpenModal, setOpenModal] = useState<boolean>(false);
  const [isChild, setIsChild] = useState<number>(3);
  const onClickToggleModal = useCallback(() => {
    setOpenModal(!isOpenModal);
    setIsChild(3);
  }, [isOpenModal]);

  //프로필사진
  const [profile, setProfile] = useState("");
  const fileInput = useRef(null);
  //한줄소개
  const [intro, setIntro] = useState("");
  //로그아웃
  if (paramsId === info.id) {
    if (!readNickName) {
      return null;
    }
    if (!getMyPostList) {
      return null;
    }
  } else {
    if (!otherUser) {
      return null;
    }
    if (!otherpostNum) {
      return null;
    }
  }

  //     다른유저로 들어왔을때 서버에서 받아야되는 정보 : 유저아이디, postalAddress, 닉네임, 프사
  async function getOtherUserProfile() {
    try {
      const res = await Api.get(`/user/${paramsId}`);
      if (res.data.address == "") {
        setOtherUser({
          otherUserAddress: "아직 동네 인증을 안한 ",
          otherUserProfile: res.data.userInfo.imageUrl,
          otherUserNick: res.data.userInfo.nickname,
        });
      } else {
        const otherAddress2_3 = res.data.address[0].postalAddress;
        const arr1 = otherAddress2_3.split(" ");
        setOtherUser({
          otherUserAddress: arr1[2],
          otherUserProfile: res.data.userInfo.imageUrl,
          otherUserNick: res.data.userInfo.nickname,
        });
      }
    } catch (err) {
      console.log(err);
      toastMsg("다른 이웃의 게시글을 보려면 로그인을 먼저 진행해주세요!");
      setTimeout(() => {
        navigate("/login");
      }, 10);
    }
  }

  //
  // 다른 사람 게시글
  async function getOtherUserPostList() {
    try {
      const res = await Api.get(`/post/user/${paramsId}`);
      console.log("내 게시글", Object.keys(res.data.content).length);
      // @ts-ignore
      setotherNum(Object.keys(res.data.content).length);
    } catch (err) {
      console.log(err);
    }
  }

  ///////////
  async function readNickName() {
    try {
      const res = await Api.get("/user");
      setuserInfo((prevState) => {
        return {
          ...prevState,
          userId: res.data.userDetail.id,
        };
      });
    } catch (err) {
      console.log(err);
    }
  }

  async function getMyPostList() {
    //interceptor를 사용한 방식 (header에 token값 전달)
    try {
      console.log(store);
      const res = await Api.get("/user/posts?");
      const array = res.data.content.slice();
      const result = array.filter((item) => {
        return item.tradeStatus === "TRADED";
      });

      setTradedNum(result.length);

      // @ts-ignore
      setNum(Object.keys(res.data.content).length);
    } catch (err) {
      console.log(err);
    }
  }

  const onChangeImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files) {
      const uploadFile = e.target.files[0];
      const formData = new FormData();
      formData.append("imageFiles", uploadFile);
      const res = await axios.post(
        "https://f3f-cokiri.site/auth/image/profileImage",
        formData
      );
      dispatch(setUserProfile(res.data.imageUrls[0]));
      const mbody = {
        userId: info.id,
        newImageUrl: res.data.imageUrls[0],
      };
      const res2 = await Api.patch("/user/imageUrl", mbody);
    }
  };

  async function logOut() {
    try {
      const res = await Api.get("/logout");
      console.log(res);
      toastMsg("로그아웃");
      dispatch(logoutToken());
      dispatch(logoutUserInfo());
      dispatch(resetaddress1());
      dispatch(resetaddress2());
      dispatch(resetTalkCard());
      navigate(`/`);
    } catch (err) {
      console.log(err);
    }
  }
  return (
    <>
      <div className={styles.profile}>
        {isOpenModal && (
          <SettingModal onClickToggleModal={onClickToggleModal} num={menuNum}>
            <embed type="text/html" width="800" height="608" />
          </SettingModal>
        )}
        <div className={styles.profileImage}>
          {paramsId == info.id ? (
            <>
              <img
                className={styles.Image}
                src={info.imageUrl}
                onClick={() => {
                  fileInput.current.click();
                }}
              />
              <form>
                <input
                  type="file"
                  style={{ display: "none" }}
                  accept="image/*"
                  onChange={onChangeImg}
                  ref={fileInput}
                />
              </form>
            </>
          ) : (
            <img className={styles.Image} src={otherUser.otherUserProfile} />
          )}
        </div>
        <div className={styles.userInfo}>
          <div className={styles.wheelBox}>
            {paramsId == info.id ? (
              <div className={styles.nickName}>{newNick}</div>
            ) : (
              <div className={styles.nickName}>{otherUser.otherUserNick}</div>
            )}
            {/*다른 유저 마이페이지 들어왔을때는 이게 나오면 안돼*/}
            {paramsId == info.id ? (
              <button
                className={styles.wheelBox2}
                onClick={() => {
                  setMenuNum(1);
                  onClickToggleModal();
                }}
              >
                <img className={styles.wheel} src={setting} />
                <div className={styles.setting}>프로필 편집</div>
              </button>
            ) : (
              <></>
            )}
          </div>
          {paramsId == info.id ? (
            <button className={styles.nickChangeBtn} onClick={logOut}>
              로그아웃
            </button>
          ) : (
            <></>
          )}
          <div className={styles.intro2}>
            <div className={styles.i1}>
              {/*다른유저일때 if문 걸어서 체크해야지*/}
              <p>게시글</p>
              {paramsId == info.id ? (
                <p className={styles.postNum}>{postNum}</p>
              ) : (
                <p className={styles.postNum}>{otherpostNum}</p>
              )}
            </div>
            {/*<div className={styles.i1}>*/}
            {/*  <p>상품 거래</p>*/}
            {/*  <p className={styles.tradeNum}>{tradedNum}</p>*/}
            {/*</div>*/}
          </div>
          {
            /*다른 유저면 다른 if문 하나 더 걸어서 분리*/
            paramsId == info.id ? (
              store.userAddressInfoReducer.oneWordAddress1 == undefined ? (
                <p
                  className={styles.i2_2}
                  onClick={() => {
                    setMenuNum(3);

                    onClickToggleModal();
                  }}
                >
                  동네 인증을 해주세요!
                </p>
              ) : (
                <p className={styles.i2}>
                  {" "}
                  {store.userAddressInfoReducer.oneWordAddress1} 주민이에요.
                </p>
              )
            ) : (
              <p className={styles.i2}>
                {" "}
                {otherUser.otherUserAddress} 주민이에요.
              </p>
            )
          }
        </div>
      </div>
      <div className={styles.menu}>
        {paramsId == info.id ? (
          <>
            {tab1 === "next" ? (
              <button
                className={`${
                  styles["post" + (tab1 === "next" ? "" : "active")]
                }`}
                onClick={() => {
                  setDealTab("next");
                  navigate(`/mypage/${info.id}`);
                }}
              >
                게시글
              </button>
            ) : (
              <button
                className={`${
                  styles["post" + (tab1 === "next" ? "" : "active")]
                }`}
                onClick={() => {
                  setDealTab("next");
                  navigate(`/mypage/${info.id}`);
                }}
              >
                게시글
              </button>
            )}
            {tab1 === "curr" ? (
              <button
                className={`${
                  styles["zzim" + (tab1 === "curr" ? "" : "active")]
                }`}
                onClick={() => {
                  setDealTab("curr");
                  navigate(`/mypage/zzim/${info.id}`);
                }}
              >
                관심 상품
              </button>
            ) : (
              <button
                className={`${
                  styles["zzim" + (tab1 === "curr" ? "" : "active")]
                }`}
                onClick={() => {
                  setDealTab("curr");
                  navigate(`/mypage/zzim/${info.id}`);
                }}
              >
                관심 상품
              </button>
            )}
          </>
        ) : (
          <>
            <button className={styles.post}>게시글</button>
          </>
        )}
      </div>

      <Outlet />
    </>
  );
};

export default MyPage;
