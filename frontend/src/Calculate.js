import React, { useEffect, useState } from 'react';
import setMap from './setMap.json'; // 세트 이름 매핑 JSON 파일
import setBonuses from './setBonuses.json'; // 세트 보너스 데이터 JSON 파일

const Calculate = ({ userOcid, calculatedStats, imageUploadStats }) => {
    const API_KEY = "live_57d709dd5f22133108bddcc733433d52f5d95a60c8e1751d895143547388bbb5efe8d04e6d233bd35cf2fabdeb93fb0d";
    
    // stats 기본값 정의
    const initialStats = {
        "세트": "정보 없음",
        "공마": 0,
        "주스탯": 0,
        "부스탯": 0,
        "부스탯2": 0,
        "올스탯": 0,
        "공마%": 0,
        "주스탯%": 0,
        "부스탯%": 0,
        "부스탯2%": 0,
        "보공": 0,
        "방무": 0,
        "데미지": 0,
        "크뎀": 0,
        "쿨감": 0,
        "9렙당주스탯": 0,
        "9렙당부스탯": 0,
        "9렙당부스탯2": 0
    };

    const [setCounts, setSetCounts] = useState({});
    const [stats, setStats] = useState(initialStats);
    const [finalStats, setFinalStats] = useState(initialStats);

    // 특정 세트와 그 개수에 대한 옵션 합산
    const calculateSetStats = (setName, setCount) => {
        let totalStats = { ...initialStats };

        if (setBonuses[setName]) {
            Object.keys(setBonuses[setName]).forEach((tier) => {
                if (setCount >= tier) {
                    const bonuses = setBonuses[setName][tier];
                    Object.keys(bonuses).forEach((stat) => {
                        totalStats[stat] = (totalStats[stat] || 0) + bonuses[stat];
                    });
                }
            });
        }

        return totalStats;
    };

    // beforeSetStats와 afterSetStats 계산
    useEffect(() => {
        const currentSet = calculatedStats["세트"];
        const newSet = imageUploadStats["세트"];

        if (currentSet === newSet) {
            setStats({});
        } else {
            let beforeSetStats = { ...initialStats };
            let afterSetStats = { ...initialStats };

            // beforeSetStats 계산
            if (currentSet) {
                const currentSetCount = setCounts[currentSet] || 0;
                const currentSetStats = calculateSetStats(currentSet, currentSetCount);
                Object.keys(currentSetStats).forEach(stat => {
                    beforeSetStats[stat] = (beforeSetStats[stat] || 0) + currentSetStats[stat];
                });
            }

            if (newSet) {
                const newSetCount = setCounts[newSet] || 0;
                const newSetStats = calculateSetStats(newSet, newSetCount);
                Object.keys(newSetStats).forEach(stat => {
                    beforeSetStats[stat] = (beforeSetStats[stat] || 0) + newSetStats[stat];
                });
            }

            // afterSetStats 계산
            if (currentSet) {
                const newCurrentSetCount = Math.max(0, (setCounts[currentSet] || 0) - 1);
                const currentSetStats = calculateSetStats(currentSet, newCurrentSetCount);
                Object.keys(currentSetStats).forEach(stat => {
                    afterSetStats[stat] = (afterSetStats[stat] || 0) + currentSetStats[stat];
                });
            }

            if (newSet) {
                const newNewSetCount = (setCounts[newSet] || 0) + 1;
                const newSetStats = calculateSetStats(newSet, newNewSetCount);
                Object.keys(newSetStats).forEach(stat => {
                    afterSetStats[stat] = (afterSetStats[stat] || 0) + newSetStats[stat];
                });
            }

            // 결과 출력
            const setOptionStats = {};
            console.log(beforeSetStats);
            console.log(afterSetStats);
            Object.keys(afterSetStats).forEach(stat => {
                setOptionStats[stat] = (afterSetStats[stat] || 0) - (beforeSetStats[stat] || 0);
            });

            setStats(setOptionStats);
        }
    }, [calculatedStats, imageUploadStats, setCounts]);

    // Calculate finalStats
    useEffect(() => {
        if (calculatedStats && imageUploadStats && stats) {
            let finalStats = { ...initialStats };

            // Calculate the difference between imageUploadStats and calculatedStats
            Object.keys(imageUploadStats).forEach(setName => {
                if (calculatedStats[setName] !== undefined && imageUploadStats[setName] !== undefined) {
                    const imageUploadStat = imageUploadStats[setName];
                    const calculatedStat = calculatedStats[setName];
                    const diff = imageUploadStat - calculatedStat;
                    finalStats[setName] = (finalStats[setName] || 0) + diff;
                }
            });

            // Add stats to the finalStats
            Object.keys(stats).forEach(stat => {
                finalStats[stat] = (finalStats[stat] || 0) + stats[stat];
            });

            setFinalStats(finalStats);
        }
    }, [calculatedStats, imageUploadStats, stats]);

    // Nexon API에서 세트 효과 데이터를 불러오는 함수
    useEffect(() => {
        const fetchSetOptionData = async (ocid) => {
            const setOptionUrl = `https://open.api.nexon.com/maplestory/v1/character/set-effect?ocid=${ocid}`;

            try {
                const response = await fetch(setOptionUrl, {
                    headers: { "x-nxopen-api-key": API_KEY },
                });

                if (!response.ok) {
                    throw new Error("장비 데이터를 불러오는 데 실패했습니다.");
                }

                const data = await response.json();
                const newSetCounts = {};

                data.set_effect.forEach((set) => {
                    const setName = set.set_name;
                    const totalCount = set.total_set_count;

                    if (setName && totalCount) {
                        const mappedSetName = setMap[setName];
                        if (mappedSetName) {
                            newSetCounts[mappedSetName] = (newSetCounts[mappedSetName] || 0) + totalCount;
                        }
                    }
                });

                setSetCounts(newSetCounts);
            } catch (error) {
                console.error("장비 데이터를 불러오는 데 실패했습니다.", error);
            }
        };

        if (userOcid) {
            fetchSetOptionData(userOcid);
        }
    }, [userOcid]);

    return (
        <div>
            <h3>세트 옵션</h3>
            <ul>
                {Object.entries(stats).map(([stat, value]) => (
                    <li key={stat}>{stat}: {value}</li>
                ))}
            </ul>
            <h2>최종 스탯 증감</h2>
            <table border="1">
                <thead>
                    <tr>
                        <th>보총</th>
                        <th>공마</th>
                        <th>공마%</th>
                        <th>크뎀</th>
                        <th>방무</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{finalStats["보공"]+finalStats["데미지"]}</td>
                        <td>{finalStats["공마"]}</td>
                        <td>{finalStats["공마%"]}</td>
                        <td>{finalStats["크뎀"]}</td>
                        <td>{finalStats["방무"]}</td>
                    </tr>
                </tbody>
            </table>
            
            <table border="1">
                <thead>
                    <tr>
                        <th>주스탯</th>
                        <th>주스탯%</th>
                        <th>부스탯</th>
                        <th>부스탯%</th>
                        <th>부스탯2</th>
                        <th>부스탯2%</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{finalStats["주스탯"]}</td>
                        <td>{finalStats["주스탯%"]}</td>
                        <td>{finalStats["부스탯"]}</td>
                        <td>{finalStats["부스탯%"]}</td>
                        <td>{finalStats["부스탯2"]}</td>
                        <td>{finalStats["부스탯2%"]}</td>
                    </tr>
                </tbody>
            </table>

            <table border="1">
                <thead>
                    <tr>
                        <th>9렙당주스탯</th>
                        <th>9렙당부스탯</th>
                        <th>9렙당부스탯2</th>
                        <th>올스탯</th>
                        <th>쿨감</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{finalStats["9렙당주스탯"]}</td>
                        <td>{finalStats["9렙당부스탯"]}</td>
                        <td>{finalStats["9렙당부스탯2"]}</td>
                        <td>{finalStats["올스탯"]}</td>
                        <td>{finalStats["쿨감"]}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default Calculate;
