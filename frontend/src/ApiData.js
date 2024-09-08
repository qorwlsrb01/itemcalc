import React, { useState, useEffect } from "react";
import characterStats from "./characterStats.json";
import setItemList from './setItemList.json';

const API_KEY = "live_57d709dd5f22133108bddcc733433d52f5d95a60c8e1751d895143547388bbb5efe8d04e6d233bd35cf2fabdeb93fb0d";

const ApiData = ({ selectedSlot, setCharacterInfo, characterInfo, setUserOcid, onCalculatedStats }) => {
  const [nickname, setNickname] = useState("");
  const [characterData, setCharacterData] = useState(null);
  const [equipmentData, setEquipmentData] = useState(null);
  const [error, setError] = useState(null);
  const [activeSlot, setActiveSlot] = useState(null);

  const statsCategories = [
    "세트", "공마", "주스탯", "부스탯", "부스탯2", "올스탯", "공마%", "주스탯%", "부스탯%", "부스탯2%",
    "보공", "방무", "데미지", "크뎀", "쿨감", "9렙당주스탯", "9렙당부스탯", "9렙당부스탯2",
  ];

  const getStatValue = (type) => {
    switch (type) {
      case "공마":
        return characterInfo.공마 === "공격력" ? "attack_power" : "magic_power";
      case "주스탯":
        return {
          STR: "str",
          DEX: "dex",
          INT: "int",
          LUK: "luk",
          HP: "max_hp",
        }[characterInfo.주스탯] || null;
      case "부스탯":
        return {
          STR: "str",
          DEX: "dex",
          INT: "int",
          LUK: "luk",
          HP: "max_hp",
        }[characterInfo.부스탯] || null;
      case "부스탯2":
        return {
          STR: "str",
          DEX: "dex",
          INT: "int",
          LUK: "luk",
          HP: "max_hp",
        }[characterInfo.부스탯2] || null;
      default:
        return null;
    }
  };

  const calculateEquipmentStats = (equipment) => {
    const stats = {};
    statsCategories.forEach((category) => {
      stats[category] = 0;
    });

    const determineSet = (itemName) => {
      for (const [setName, items] of Object.entries(setItemList)) {
        if (items.includes(itemName)) {
          return setName;
        }
      }
      return "정보 없음";
    };

    stats["세트"] = determineSet(equipment.item_name);

    const options = equipment.item_total_option || {};

    const calculateStat = (statName) => {
      const mappedStatName = getStatValue(statName);
      if (mappedStatName && options[mappedStatName] !== undefined) {
        stats[statName] = parseFloat(options[mappedStatName]);
      }
    };

    ["공마", "주스탯", "부스탯", "부스탯2", "올스탯"].forEach((statName) =>
      calculateStat(statName)
    );

    ["공마%", "주스탯%", "부스탯%", "부스탯2%"].forEach((statName) =>
      calculateStat(statName)
    );

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

    ["크뎀", "쿨감"].forEach((statName) => calculateStat(statName));

    ["9렙당주스탯", "9렙당부스탯", "9렙당부스탯2"].forEach((statName) =>
      calculateStat(statName)
    );

    const potentialOptions = [
      "potential_option_1",
      "potential_option_2",
      "potential_option_3",
      "additional_potential_option_1",
      "additional_potential_option_2",
      "additional_potential_option_3",
      "soul_option",
    ];

    potentialOptions.forEach((optionKey) => {
      const optionValue = equipment[optionKey];
      if (optionValue) {
        if (optionValue.startsWith("모든 스킬의 재사용 대기시간")) {
          const cooldownMatch = optionValue.match(/([-+]?\d+)초/);
          if (cooldownMatch) {
            const numericValue = parseFloat(cooldownMatch[1]);
            stats["쿨감"] -= numericValue;
          }
        } else {
          const match = optionValue.match(/^(.+?)(\d+)(%?)$/);
          if (match) {
            const [_, statName, value, percent] = match;
            const numericValue = parseFloat(value);

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
              stats["방무"] = (1 - (1 - stats["방무"] / 100) * (1 - numericValue / 100)) * 100;
              stats["방무"] = parseFloat(stats["방무"].toFixed(3));
            } else if (statName.startsWith("크리티컬 데미지")) {
              stats["크뎀"] += numericValue;
            } else if (statName.startsWith("데미지")) {
              stats["데미지"] += numericValue;
            } else if (statName.startsWith("캐릭터 기준 9레벨 당 " + characterInfo.주스탯)) {
              stats["9렙당주스탯"] += numericValue;
            } else if (statName.startsWith("캐릭터 기준 9레벨 당 " + characterInfo.부스탯)) {
              stats["9렙당부스탯"] += numericValue;
            } else if (statName.startsWith("캐릭터 기준 9레벨 당 " + characterInfo.부스탯2)) {
              stats["9렙당부스탯2"] += numericValue;
            }
          }
        }
      }
    });

    return stats;
  };

  const fetchCharacterData = async () => {
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
        setUserOcid(data.ocid);
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
  }, [equipmentData, setCharacterInfo]);

  useEffect(() => {
    if (selectedSlot === "반지") {
      setActiveSlot('반지1');
    } else if (selectedSlot) {
      setActiveSlot(selectedSlot);
    }
  }, [selectedSlot]);

  useEffect(() => {
    if (equipmentData && activeSlot) {
      const equipment = (equipmentData.item_equipment || []).find(
        (item) => item.item_equipment_slot === activeSlot
      );
      if (equipment) {
        const stats = calculateEquipmentStats(equipment);
        if (onCalculatedStats) {
          // Call `onCalculatedStats` outside the render phase
          setTimeout(() => onCalculatedStats(stats), 0);
        }
      }
    }
  }, [activeSlot, equipmentData]);

  const filteredEquipment = (equipmentData?.item_equipment || []).filter(
    (equipment) => {
      if (activeSlot) {
        return equipment.item_equipment_slot === activeSlot;
      }
      return true;
    }
  );

  const slots = [
    ["무기", "보조무기", "엠블렘"],
    ["모자", "상의", "하의", "장갑", "망토", "신발"],
    ["어깨장식", "얼굴장식", "눈장식", "귀고리", "벨트", "포켓 아이템", "뱃지"],
    ["반지1", "반지2", "반지3", "반지4", "펜던트", "펜던트2", "기계 심장"],
  ];

  const renderStats = (stats) => {
    return Object.keys(stats).map((stat) => (
      <div key={stat}>
        <div>{stat} : {stats[stat] !== 0 ? stats[stat] : '0'}</div>
      </div>
    ));
  };

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
          <div>공마 : {characterInfo?.공마 || "정보 없음"}</div>
          <div>주스탯 : {characterInfo?.주스탯 || "정보 없음"}</div>
          <div>부스탯 : {characterInfo?.부스탯 || "정보 없음"}</div>
          {characterInfo?.부스탯2 && (
            <div>부스탯2 : {characterInfo.부스탯2}</div>
          )}
        </div>
      )}

      {characterData && equipmentData && (
        <div>
          <h2>장비 슬롯 선택:</h2>
          {slots.map((row, rowIndex) => (
            <div key={rowIndex} style={{ display: "flex", marginBottom: "10px" }}>
              {row.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setActiveSlot(slot)}
                  style={{
                    backgroundColor: activeSlot === slot ? "lightblue" : "white",
                  }}
                >
                  {slot}
                </button>
              ))}
            </div>
          ))}

          {filteredEquipment && (
            <div>
              <h3>장비 정보:</h3>
              {filteredEquipment.length > 0 && filteredEquipment.length < 5 ? (
                filteredEquipment.map((equipment) => (
                  <div key={equipment.item_name}>
                    <img src={equipment.item_icon} alt={equipment.item_name} />
                    <div>
                      {equipment.item_name}
                    </div>
                    <div>
                      {renderStats(calculateEquipmentStats(equipment))}
                    </div>
                  </div>
                ))
              ) : (
                <p>선택된 슬롯에 장비가 없습니다.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ApiData;
