import React, { useState, useEffect } from "react";
import characterStats from "./characterStats.json"; // JSON 파일 불러오기

const API_KEY =
  "live_57d709dd5f22133108bddcc733433d52f5d95a60c8e1751d895143547388bbb5efe8d04e6d233bd35cf2fabdeb93fb0d"; // API 키는 실제 값으로 교체

const ApiData = () => {
  const [nickname, setNickname] = useState("");
  const [characterData, setCharacterData] = useState(null);
  const [equipmentData, setEquipmentData] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [error, setError] = useState(null);
  const [characterInfo, setCharacterInfo] = useState({});

  const statsCategories = [
    "공마",
    "주스탯",
    "부스탯",
    "부스탯2",
    "올스탯",
    "공마%",
    "주스탯%",
    "부스탯%",
    "부스탯2%",
    "보공",
    "방무",
    "데미지",
    "크뎀",
    "쿨감",
    "9렙당주스탯",
    "9렙당부스탯",
    "9렙당부스탯2",
  ];

  const getStatValue = (type) => {
    switch (type) {
      case "공마":
        return characterInfo.공마 === "공격력" ? "attack_power" : "magic_power";
      case "주스탯":
        switch (characterInfo.주스탯) {
          case "STR":
            return "str";
          case "DEX":
            return "dex";
          case "INT":
            return "int";
          case "LUK":
            return "luk";
          case "HP":
            return "max_hp";
          default:
            return null;
        }
      case "부스탯":
        switch (characterInfo.부스탯) {
          case "STR":
            return "str";
          case "DEX":
            return "dex";
          case "INT":
            return "int";
          case "LUK":
            return "luk";
          case "HP":
            return "max_hp";
          default:
            return null;
        }
      case "부스탯2":
        switch (characterInfo.부스탯2) {
          case "STR":
            return "str";
          case "DEX":
            return "dex";
          case "INT":
            return "int";
          case "LUK":
            return "luk";
          case "HP":
            return "max_hp";
          default:
            return null;
        }
      default:
        return null;
    }
  };

  const calculateEquipmentStats = (equipment) => {
    const stats = {};

    // 기본 통계 항목 초기화
    statsCategories.forEach((category) => {
      stats[category] = 0;
    });

    const options = equipment.item_total_option || {}; // item_total_option에서 옵션을 가져옵니다.

    // 각 통계 항목에 대해 값을 설정
    const calculateStat = (statName) => {
      const mappedStatName = getStatValue(statName);
      if (mappedStatName && options[mappedStatName] !== undefined) {
        stats[statName] = parseFloat(options[mappedStatName]);
      }
    };

    // 공마, 주스탯, 부스탯, 부스탯2를 계산
    ["공마", "주스탯", "부스탯", "부스탯2", "올스탯"].forEach((statName) =>
      calculateStat(statName)
    );

    // 공마%, 주스탯%, 부스탯%, 부스탯2% 계산
    ["공마%", "주스탯%", "부스탯%", "부스탯2%"].forEach((statName) =>
      calculateStat(statName)
    );

    // 보공, 방무, 데미지, 크뎀, 쿨감 계산
    const directStatMappings = {
      보공: "boss_damage",
      방무: "ignore_monster_armor",
      데미지: "damage",
      올스탯: "all_stat",
    };

    Object.keys(directStatMappings).forEach((statName) => {
      const optionKey = directStatMappings[statName];
      if (options[optionKey] !== undefined) {
        stats[statName] = parseFloat(options[optionKey]);
      }
    });

    // 크뎀, 쿨감 계산
    ["크뎀", "쿨감"].forEach((statName) => calculateStat(statName));

    // 9렙당 주스탯, 9렙당 부스탯, 9렙당 부스탯2 계산
    ["9렙당주스탯", "9렙당부스탯", "9렙당부스탯2"].forEach((statName) =>
      calculateStat(statName)
    );

    // 추가 잠재 능력 및 기타 옵션 처리
    const potentialOptions = [
      "potential_option_1",
      "potential_option_2",
      "potential_option_3",
      "additional_potential_option_1",
      "additional_potential_option_2",
      "additional_potential_option_3",
    ];

    potentialOptions.forEach((optionKey) => {
      const optionValue = equipment[optionKey]; // equipment 객체에서 직접 옵션 값을 가져옵니다.
      if (optionValue) {
        // '모든 스킬의 재사용 대기시간' 처리
        if (optionValue.startsWith("모든 스킬의 재사용 대기시간")) {
          const cooldownMatch = optionValue.match(/([-+]?\d+)초/); // '초' 이전의 숫자 추출
          if (cooldownMatch) {
            const numericValue = parseFloat(cooldownMatch[1]); // 추출한 숫자 값
            stats["쿨감"] -= numericValue;
          }
        } else {
          // 기존의 숫자와 %를 처리하는 로직
          const match = optionValue.match(/^(.+?)(\d+)(%?)$/); // 문자와 숫자, %를 분리
          if (match) {
            const [_, statName, value, percent] = match;
            const numericValue = parseFloat(value);    
    
            // characterInfo에서 참조하여 올바른 통계 항목에 값을 더함
            if (statName.startsWith(characterInfo.공마)) {
              if (percent) {
                stats["공마%"] += numericValue;
              } else {
                stats["공마"] += numericValue;
              }
            } else if (statName.startsWith(characterInfo.주스탯)) {
              if (percent) {
                stats["주스탯%"] += numericValue;
              } else {
                stats["주스탯"] += numericValue;
              }
            } else if (statName.startsWith(characterInfo.부스탯)) {
              if (percent) {
                stats["부스탯%"] += numericValue;
              } else {
                stats["부스탯"] += numericValue;
              }
            } else if (statName.startsWith(characterInfo.부스탯2)) {
              if (percent) {
                stats["부스탯2%"] += numericValue;
              } else {
                stats["부스탯2"] += numericValue;
              }
            } else if (statName.startsWith("올스탯")) {
              if (percent) {
                stats["올스탯"] += numericValue;
              } else {
                stats["주스탯"] += numericValue;
                stats["부스탯"] += numericValue;
                stats["부스탯2"] += numericValue;
              }
            } else if (statName.startsWith("보스 몬스터 공격 시 데미지")) {
              stats["보공"] += numericValue;
            } else if (statName.startsWith("몬스터 방어율 무시")) {
              stats["방무"] += numericValue;
            } else if (statName.startsWith("크리티컬 데미지")) {
              stats["크뎀"] += numericValue;
            } else if (statName.startsWith("데미지")) {
              stats["데미지"] += numericValue;
            } else if (statName.startsWith("캐릭터 기준 9레벨 당 "+characterInfo.주스탯)) {
              stats["9렙당주스탯"] += numericValue;
            } else if (statName.startsWith("캐릭터 기준 9레벨 당 "+characterInfo.부스탯)) {
              stats["9렙당부스탯"] += numericValue;
            } else if (statName.startsWith("캐릭터 기준 9레벨 당 "+characterInfo.부스탯2)) {
              stats["9렙당부스탯2"] += numericValue;
            }
          } 
        }
      }
    });
    
    return stats;
  };

  const fetchCharacterData = async () => {
    if (!nickname) {
      alert("닉네임을 입력해주세요.");
      return;
    }

    const urlString = `https://open.api.nexon.com/maplestory/v1/id?character_name=${nickname}`;

    try {
      const response = await fetch(urlString, {
        headers: {
          "x-nxopen-api-key": API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error("데이터를 불러오는 데 실패했습니다.");
      }

      const data = await response.json();
      setCharacterData(data);
      setError(null);

      if (data.ocid) {
        fetchEquipmentData(data.ocid);
      } else {
        setError("캐릭터의 ocid를 찾을 수 없습니다.");
      }
    } catch (error) {
      setError(error.message);
      setCharacterData(null);
    }
  };

  const fetchEquipmentData = async (ocid) => {
    const equipmentUrl = `https://open.api.nexon.com/maplestory/v1/character/item-equipment?ocid=${ocid}`;

    try {
      const response = await fetch(equipmentUrl, {
        headers: {
          "x-nxopen-api-key": API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error("장비 데이터를 불러오는 데 실패했습니다.");
      }

      const data = await response.json();
      setEquipmentData(data);
      setError(null);
    } catch (error) {
      setError(error.message);
      setEquipmentData(null);
    }
  };

  useEffect(() => {
    if (equipmentData && equipmentData.character_class) {
      const job = equipmentData.character_class;
      const info = characterStats[job] || {};
      setCharacterInfo(info);
    }
  }, [equipmentData]);

  const getPresetEquipment = () => {
    switch (selectedPreset) {
      case 1:
        return equipmentData?.item_equipment_preset_1 || [];
      case 2:
        return equipmentData?.item_equipment_preset_2 || [];
      case 3:
        return equipmentData?.item_equipment_preset_3 || [];
      default:
        return [];
    }
  };

  const filteredEquipment = getPresetEquipment().filter(
    (equipment) => {
      if (selectedSlot) {
        return equipment.item_equipment_slot === selectedSlot;
      }
      return true;
    }
  );

  const equipmentStatsArray =
    filteredEquipment?.map((equipment) => ({
      item_name: equipment.item_name,
      stats: calculateEquipmentStats(equipment),
    })) || [];

  return (
    <div>
      <h1>캐릭터 정보 검색</h1>
      <input
        type="text"
        placeholder="닉네임을 입력하세요"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />
      <button onClick={fetchCharacterData}>검색</button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {characterData && (
        <div>
          <h2>캐릭터 기본 정보:</h2>
          <div>직업 : {equipmentData?.character_class}</div>
          <div>공마 : {characterInfo.공마 || "정보 없음"}</div>
          <div>주스탯 : {characterInfo.주스탯 || "정보 없음"}</div>
          <div>부스탯 : {characterInfo.부스탯 || "정보 없음"}</div>
          {characterInfo.부스탯2 && (
            <div>부스탯2 : {characterInfo.부스탯2}</div>
          )}
        </div>
      )}

      {equipmentData && (
        <div>
          <h2>장비 프리셋 선택:</h2>
          {[1, 2, 3].map((preset) => (
            <button key={preset} onClick={() => setSelectedPreset(preset)}>
              프리셋 {preset}
            </button>
          ))}

          {selectedPreset && (
            <div>
              <h3>장비 슬롯 선택:</h3>
              {[
                "무기",
                "보조무기",
                "엠블렘",
                "모자",
                "상의",
                "하의",
                "장갑",
                "망토",
                "신발",
                "얼굴장식",
                "눈장식",
                "귀고리",
                "어깨장식",
                "반지1",
                "반지2",
                "반지3",
                "반지4",
                "펜던트",
                "펜던트2",
                "벨트",
                "포켓 아이템",
                "뱃지",
              ].map((slot) => (
                <button key={slot} onClick={() => setSelectedSlot(slot)}>
                  {slot}
                </button>
              ))}
            </div>
          )}

          {selectedPreset && filteredEquipment && (
            <div>
              <h3>장비 정보 (프리셋 {selectedPreset}):</h3>
              {filteredEquipment.length > 0 ? (
                filteredEquipment.map((equipment) => (
                  <div key={equipment.item_name}>
                    <img src={equipment.item_icon} alt={equipment.item_name} />
                    <p onClick={() => setSelectedItem(equipment)}>
                      {equipment.item_name}
                    </p>
                    <pre>
                      {JSON.stringify(
                        calculateEquipmentStats(equipment),
                        null,
                        2
                      )}
                    </pre>
                  </div>
                ))
              ) : (
                <p>선택된 슬롯에 장비가 없습니다.</p>
              )}
            </div>
          )}

          {selectedItem && (
            <div>
              <h3>선택된 아이템 정보:</h3>
              <img src={selectedItem.item_icon} alt={selectedItem.item_name} />
              <div>아이템 이름: {selectedItem.item_name}</div>
              <pre>{JSON.stringify(selectedItem, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ApiData;
