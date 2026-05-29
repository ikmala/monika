import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import Header from "../(componens)/Header";
import Svg, { Circle } from "react-native-svg";
import { LineChart } from "react-native-chart-kit";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getDatabase, ref, onValue } from "firebase/database";
import { auth, db } from "../../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { RefreshControl } from "react-native";

import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import DateTimePicker from "@react-native-community/datetimepicker";

/* =========================
   TYPES & CONST
   ========================= */
type Metric = "Temp" | "PH" | "TDS";
const ACTIVE_MONTH = new Date().toISOString().slice(0, 7);

interface RowData {
  id: string;
  date: Date;
  Temp: number;
  PH: number;
  TDS: number;
}

/* =========================
   MAIN COMPONENT
   ========================= */
const KualitasAir = () => {
  const [deviceId, setDeviceId] = useState("");
  const [realtime, setRealtime] = useState({ Temp: 0, PH: 0, TDS: 0 });
  const [rows, setRows] = useState<RowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<Metric>("Temp");

  /* RANGE DATE */
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const normalizeDate = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const endOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  /* =========================
     LOAD DEVICE ID
     ========================= */
  useEffect(() => {
    const load = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) setDeviceId(snap.data().deviceId);
    };
    load();
  }, []);

  /* =========================
     REALTIME DATABASE
     ========================= */
  useEffect(() => {
    if (!deviceId) return;

    const rtdb = getDatabase();
    const r = ref(rtdb, deviceId);

    return onValue(r, snap => {
      if (!snap.exists()) return;
      const v = snap.val();
      setRealtime({
        Temp: v.Temp ?? 0,
        PH: v.PH ?? 0,
        TDS: v.TDS ?? 0,
      });
    });
  }, [deviceId]);

  /* =========================
     FIRESTORE DATA
     ========================= */
  useEffect(() => {
    if (!deviceId) return;
    fetchAllData();
  }, [deviceId]);
  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  const fetchAllData = async () => {
    if (!deviceId) return;

    try {
      setLoading(true);

      const colRef = collection(db, "devices", deviceId, ACTIVE_MONTH);
      const snap = await getDocs(colRef);

      const [year, month] = ACTIVE_MONTH.split("-");

      const data: RowData[] = snap.docs.map(docSnap => {
        const id = docSnap.id;       // contoh: "01-20"
        const [dayPart] = id.split("-");

        const day = Number(dayPart);
        const values = docSnap.data()?.values ?? {};

        return {
          id,
          date: new Date(
            Number(year),
            Number(month) - 1,
            day
          ),
          Temp: Number(values.Temp ?? 0),
          PH: Number(values.PH ?? 0),
          TDS: Number(values.TDS ?? 0),
        };
      });

      data.sort((a, b) => a.date.getTime() - b.date.getTime());
      setRows(data);
    } catch (e) {
      console.log("Firestore fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* =========================
     FILTER RANGE
     ========================= */
  const filteredRows = useMemo(() => {
    if (startDate && endDate && startDate > endDate) return [];

    return rows.filter(r => {
      const rowDate = r.date.getTime();

      if (startDate) {
        if (rowDate < startOfDay(startDate).getTime()) return false;
      }

      if (endDate) {
        if (rowDate > endOfDay(endDate).getTime()) return false;
      }

      return true;
    });
  }, [rows, startDate, endDate]);

  /* =========================
     CHART DATA
     ========================= */
  const chartData = useMemo(() => {
    const safeData = filteredRows
      .map(r => Number(r[metric]))
      .filter(v => Number.isFinite(v));

    return {
      labels: safeData.map((_, i) => String(i + 1)),
      datasets: [{ data: safeData.length ? safeData : [0] }],
    };
  }, [filteredRows, metric]);

  /* =========================
     EXPORT CSV
     ========================= */
  const exportCSV = async () => {
    if (!filteredRows.length) {
      Alert.alert("Data kosong", "Tidak ada data pada range ini");
      return;
    }

    const header = ["Tanggal", "Temp", "TDS", "PH"];
    const csvRows = filteredRows.map(r => [
      r.date.toISOString().split("T")[0],
      r.Temp,
      r.TDS,
      r.PH,
    ]);

    const csv = [header, ...csvRows].map(r => r.join(",")).join("\n");

    const fileUri =
      FileSystem.documentDirectory +
      `kualitas_air_${Date.now()}.csv`;

    await FileSystem.writeAsStringAsync(fileUri, csv);

    await Sharing.shareAsync(fileUri);
  };

  const PieGauge = ({
    value,
    max,
    unit,
  }: {
    value: number;
    max: number;
    unit: string;
  }) => {
    const strokeWidth = 10;
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(value / max, 1) * circumference;

    return (
      <View className="flex items-center justify-center p-2">
        <View className=" relative">
          <Svg width={120} height={120}>
            <Circle
              cx="60"
              cy="60"
              r={radius}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Circle
              cx="60"
              cy="60"
              r={radius}
              stroke="white"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              transform="rotate(90 60 60)"
            />
          </Svg>
          <View className="absolute inset-0 flex items-center justify-center">
            <Text className="text-4xl font-poppinsBold text-white">
              {value}
              {unit}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const RealtimeCard = ({
    title,
    value,
    unit,
    max,
  }: {
    title: string;
    value: number;
    unit: string;
    max: number;
  }) => {
    return (
      <View className="bg-white border-white border rounded-2xl mx-1 w-48 overflow-hidden">
        <View className="bg-hore p-4 rounded-xl flex-1 items-center justify-center">
          <PieGauge value={value} max={max} unit={unit} />

          <View className="bg-white h-1 rounded-full w-full" />

          <View className="flex-row justify-between w-full">
            <View>
              <Text className="text-white text-sm">Status</Text>
              <Text className="text-white text-sm">Integrasi Alat</Text>
            </View>
            <View>
              <Text className="text-white text-sm">Baik</Text>
              <Text className="text-white text-sm">Aman</Text>
            </View>
          </View>

          <TouchableOpacity className="bg-primary px-4 py-2 mt-3 rounded-full">
            <Text className="text-white">Rekap Data</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-hore font-bold text-center py-2">
          Terintegrasi
        </Text>
      </View>
    );
  };

  /* =========================
     RENDER
     ========================= */
  return (
    <ScrollView
    className="bg-primary"
    contentContainerStyle={{ paddingBottom: insets.bottom + 100, }}
    showsVerticalScrollIndicator={false}
    refreshControl={
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor="#fff"          // iOS spinner
        colors={["#ffffff"]}      // Android spinner
      />
    }
  >
          <Header />

          {/* REALTIME */}
          <View className="p-5">
            <Text className="text-white text-lg font-bold">Realtime</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4">
            <View className="flex-row">
              <RealtimeCard
                title="Suhu"
                value={realtime.Temp}
                unit="°C"
                max={100}
              />
              <RealtimeCard
                title="PH"
                value={realtime.PH}
                unit=""
                max={14}
              />
              <RealtimeCard
                title="TDS"
                value={realtime.TDS}
                unit="ppm"
                max={10000}
              />
            </View>
          </ScrollView>
          </View>

          {/* RANGE PICKER */}
          <View className="flex-row justify-center mb-3">
            <TouchableOpacity
              className="bg-white/20 px-4 py-2 rounded-full mx-2"
              onPress={() => setShowStart(true)}
            >
              <Text className="text-white">
                Mulai: {startDate ? startDate.toLocaleDateString() : "--"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-white/20 px-4 py-2 rounded-full mx-2"
              onPress={() => setShowEnd(true)}
            >
              <Text className="text-white">
                Sampai: {endDate ? endDate.toLocaleDateString() : "--"}
              </Text>
            </TouchableOpacity>
          </View>

          {showStart && (
            <DateTimePicker
              value={startDate || new Date()}
              mode="date"
              onChange={(_, d) => {
                setShowStart(false);
                if (d) setStartDate(d);
              }}
            />
          )}

          {showEnd && (
            <DateTimePicker
              value={endDate || new Date()}
              mode="date"
              onChange={(_, d) => {
                setShowEnd(false);
                if (d) setEndDate(d);
              }}
            />
          )}

          {/* EXPORT */}
          <View className="items-end px-5 mb-3">
            <TouchableOpacity
              onPress={exportCSV}
              className="bg-white px-4 py-2 rounded-full"
            >
              <Text className="text-primary font-bold">Export CSV</Text>
            </TouchableOpacity>
          </View>

          {/* METRIC */}
          <View className="flex-row justify-center mb-3">
            {(["Temp", "PH", "TDS"] as Metric[]).map(m => (
              <TouchableOpacity
                key={m}
                onPress={() => setMetric(m)}
                className={`px-4 py-2 mx-1 rounded-full ${
                  metric === m ? "bg-white" : "bg-white/20"
                }`}
              >
                <Text className={metric === m ? "text-primary" : "text-white"}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* CHART */}
          <View className="px-5 pb-5">
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <LineChart
                data={chartData}
                width={Dimensions.get("window").width - 20}
                height={220}
                bezier
                chartConfig={{
                  backgroundGradientFrom: "#002A58",
                  backgroundGradientTo: "#195EA9",
                  color: () => "#fff",
                  labelColor: () => "#fff",
                }}
                style={{ borderRadius: 16 }}
              />
            )}
          </View>

          {/* TABLE */}
          <View className="px-5 pb-10">
            <Text className="text-white text-lg font-bold mb-2">
              Rekap Data
            </Text>

            {/* Header */}
            <View className="flex-row justify-between border-b border-white/40 pb-2">
              <Text className="text-white flex-1 text-center">Tanggal</Text>
              <Text className="text-white flex-1 text-center">Temp</Text>
              <Text className="text-white flex-1 text-center">TDS</Text>
              <Text className="text-white flex-1 text-center">PH</Text>
            </View>

            {/* Rows */}
            {filteredRows.length === 0 ? (
              <Text className="text-white text-center mt-4">
                Tidak ada data
              </Text>
            ) : (
              filteredRows.map(item => (
                <View
                  key={item.id}
                  className="flex-row justify-between py-2 border-b border-white/20"
                >
                  <Text className="text-white flex-1 text-center">
                    {item.date.toLocaleDateString()}
                  </Text>
                  <Text className="text-white flex-1 text-center">
                    {item.Temp}
                  </Text>
                  <Text className="text-white flex-1 text-center">
                    {item.TDS}
                  </Text>
                  <Text className="text-white flex-1 text-center">
                    {item.PH}
                  </Text>
                </View>
              ))
            )}
          </View>

        </ScrollView>
  );
};

export default KualitasAir;
