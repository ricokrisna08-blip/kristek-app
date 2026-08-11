import AsyncStorage from "@react-native-async-storage/async-storage";
import { createOfflineQueueStore } from "./offlineQueueStore";

export const offlineQueueStore = createOfflineQueueStore(AsyncStorage);
