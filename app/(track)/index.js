import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Linking, StatusBar, Platform, Clipboard, Alert, Pressable, TextInput } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from "../../RootLayout";
import { useLanguage } from '../../utils/languageContext';
import { translations } from '../../utils/languageContext';
import { useSocket } from '../../utils/socketContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';
import axios from 'axios';
import ModalPresentation from "../../components/ModalPresentation";
import PickerModal from "../../components/pickerModal/PickerModal";

const TrackingOrder = () => {
  const socket = useSocket();
  const { user: authUser } = useAuth();
  const params = useLocalSearchParams();
  const { orderId, public: publicMode } = params;
  const isPublic = !!publicMode;
  const [order, setOrder] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { language } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const isRTL = language === 'ar' || language === 'he';
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const scrollViewRef = useRef(null);
  const [sectionOffsets, setSectionOffsets] = useState({
    receiver: 0,
    package: 0,
    timeline: 0,
    notes: 0,
  });
  const [privateNotes, setPrivateNotes] = useState([]);
  const [showPrivateNoteModal, setShowPrivateNoteModal] = useState(false);
  const [privateNoteText, setPrivateNoteText] = useState('');
  const [savingPrivateNote, setSavingPrivateNote] = useState(false);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const authUserRole = authUser?.role || "user";
  const isAdmin = authUserRole === 'admin' || Number(authUser?.role_id) === 1;
  const defaultUserBranchId = authUser?.branch_id || null;
  const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false);
  const [showConfirmStatusChangeUpdateModal, setShowConfirmStatusChangeUpdateModal] = useState(false);
  const [selectedValue, setSelectedValue] = useState({});
  const [selectedReason, setSelectedReason] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branches, setBranches] = useState([]);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reasonSearchQuery, setReasonSearchQuery] = useState('');
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [driverPage, setDriverPage] = useState(1);
  const [driverLoadingMore, setDriverLoadingMore] = useState(false);
  const [driverHasMore, setDriverHasMore] = useState(true);
  const [driverSearchQuery, setDriverSearchQuery] = useState('');
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [UpdatedStatusNote, setUpdatedStatusNote] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [showWhatsappOptions, setShowWhatsappOptions] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [showPrintOptionsModal, setShowPrintOptionsModal] = useState(false);
  const [selectedPrintFormat, setSelectedPrintFormat] = useState(null);
  const packageItems = useMemo(() => {
    const raw = order?.package_items ?? order?.follow_up_qr_ids ?? order?.follow_up_qr_id ?? order?.follow_up_qr ?? order?.packageItems;
    if (!raw) return [];
    let items = [];
    if (Array.isArray(raw)) {
      items = raw;
    } else if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        items = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        items = raw
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean);
      }
    }
    return items
      .map((item, index) => {
        if (item === null || item === undefined || item === '') return null;
        if (typeof item === 'object') {
          const qrId = item.qr_id ?? item.qrId ?? item.value ?? item.label ?? item.id ?? '-';
          const sequence = item.sequence ?? item.seq ?? index + 2;
          return { sequence, qr_id: String(qrId) };
        }
        return { sequence: index + 2, qr_id: String(item) };
      })
      .filter(Boolean)
      .sort((a, b) => (a?.sequence ?? 0) - (b?.sequence ?? 0));
  }, [order?.package_items, order?.follow_up_qr_ids, order?.follow_up_qr_id, order?.follow_up_qr, order?.packageItems]);
  const quantityValue = parseInt(order?.number_of_items || order?.quantity || 0, 10) || 0;
  const followUpCount = Math.max(packageItems.length, Math.max(quantityValue - 1, 0));
  const displayPackageItems = useMemo(() => {
    if (packageItems.length > 0) return packageItems;
    if (followUpCount <= 0) return [];
    return Array.from({ length: followUpCount }, (_, index) => ({
      sequence: index + 2,
      qr_id: '-'
    }));
  }, [packageItems, followUpCount]);
  const displayQuantity = followUpCount > 0 ? followUpCount + 1 : (quantityValue || 0);
  const hasFollowUpOrders = followUpCount > 0;
  const orderTypeKey = order?.order_type_key || (typeof order?.order_type === 'string' ? order.order_type.toLowerCase() : '');
  const reasonsStuck = [
    { value: 'مغلق او لا يوجد رد', label: 'مغلق او لا يوجد رد' },
    { value: 'تم تغيير العنوان', label: 'تم تغيير العنوان' },
    { value: 'رقم غير صحيح', label: 'رقم غير صحيح' },
    { value: 'تأجيل متكرر', label: 'تأجيل متكرر' }
  ];
  const reasonsRejected = [
    { value: 'غير مطابق للمواصفات', label: 'غير مطابق للمواصفات' },
    { value: 'لا يريد الاستلام', label: 'لا يريد الاستلام' },
    { value: 'ملغي من المرسل', label: 'ملغي من المرسل' }
  ];
  const defaultOther = [
    { value: 'other', label: 'سبب اخر' }
  ];
  const statusOptions = authUserRole === "driver" || authUserRole === "delivery_company" ? [{
    label: translations[language].tabs.orders.order.states.rescheduled, value: "reschedule",
    requiresReason: true,
    reasons: defaultOther
  }, {
    label: translations[language].tabs?.orders?.order?.states?.rejected, value: "rejected",
    requiresReason: true,
    reasons: [...reasonsRejected, ...defaultOther]
  }, {
    label: translations[language].tabs?.orders?.order?.states?.stuck, value: "stuck",
    requiresReason: true,
    reasons: [...reasonsStuck, ...defaultOther]
  }, {
    label: translations[language].tabs.orders.order.states.on_the_way_back, value: "on_the_way",
    requiresDriver: false
  }, {
    label: translations[language].tabs?.orders?.order?.states?.return_after_delivered_initiated, value: "return_after_delivered_initiated",
    requiresReason: true,
    reasons: defaultOther
  }, ["receive", "delivery/receive"].includes(orderTypeKey) ? {
    label: translations[language].tabs?.orders?.order?.states?.received, value: "received"
  } : {
    label: translations[language].tabs?.orders?.order?.states?.delivered, value: "delivered"
  }]
    :
    [{
      label: translations[language]?.tabs?.orders?.order?.states?.on_the_way || "On The Way", value: "on_the_way",
      requiresDriver: true
    }, {
      label: translations[language].tabs.orders.order?.states?.waiting, value: "waiting"
    }, {
      label: translations[language].tabs?.orders?.order?.states?.inBranch, value: "in_branch",
      requiresBranch: isAdmin
    }, {
      label: translations[language].tabs?.orders?.order?.states?.cancelled, value: "cancelled",
      requiresReason: true,
      reasons: defaultOther
    }, {
      label: translations[language].tabs?.orders?.order?.states?.rejected, value: "rejected",
      requiresReason: true,
      reasons: [...reasonsRejected, ...defaultOther]
    }, {
      label: translations[language].tabs.orders.order.states.rescheduled, value: "reschedule",
      requiresReason: true,
      reasons: defaultOther
    }, {
      label: translations[language].tabs?.orders?.order?.states?.stuck, value: "stuck",
      requiresReason: true,
      reasons: [...reasonsStuck, ...defaultOther]
    }, ["receive", "delivery/receive"].includes(orderTypeKey) ? {
      label: translations[language].tabs?.orders?.order?.states?.received, value: "received"
    } : {
      label: translations[language].tabs?.orders?.order?.states?.delivered, value: "delivered"
    }];
  const canChangeStatus = !isPublic && !["business", "accountant", "support_agent", "sales_representative", "warehouse_admin", "warehouse_staff"].includes(authUserRole);

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/branches`, {
        params: { language_code: language },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        withCredentials: true
      });

      const data = response.data;
      if (data && data.data) {
        const branchOptions = (data.data || [])
          .filter(branch => branch && (branch.name || branch.branch_name || branch.branch_id))
          .map(branch => ({
            label: branch.name || branch.branch_name || String(branch.branch_id),
            value: branch.branch_id
          }));
        setBranches(branchOptions);
      }
    } catch (error) {
    }
  };

  const fetchDrivers = async (page = 1, search = '', loadMore = false) => {
    if (loadMore) {
      setDriverLoadingMore(true);
    }

    try {
      const params = {
        role_id: '4,9',
        language_code: language,
        page: page
      };

      if (search) {
        params.search = search;
      }

      const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/users`, {
        params: params,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        withCredentials: true
      });
      const data = response.data;
      if (data && Array.isArray(data.data)) {
        const normalizedDrivers = data.data
          .filter(d => !!d)
          .map(d => ({
            ...d,
            name: d.name || d.user_name || d.full_name || d.username || d.label || translations[language]?.common?.unknown || "Unknown",
            phone: d.phone || d.mobile || d.user_mobile || d.receiver_mobile || ""
          }));

        if (loadMore) {
          setDrivers(prev => [...prev, ...normalizedDrivers]);
        } else {
          setDrivers(normalizedDrivers);
        }

        setDriverPage(page);

        if (data.pagination) {
          setDriverHasMore(page < data.pagination.last_page);
        } else {
          setDriverHasMore(normalizedDrivers.length >= 15);
        }
      } else if (!loadMore) {
        setDrivers([]);
        setDriverHasMore(false);
      }
    } catch (error) {
    } finally {
      setDriverLoadingMore(false);
    }
  };

  const loadMoreDrivers = () => {
    if (!driverLoadingMore && driverHasMore) {
      fetchDrivers(driverPage + 1, driverSearchQuery, true);
    }
  };

  const handleDriverSearch = (query) => {
    setDriverSearchQuery(query);
    setDriverPage(1);
    setDriverHasMore(true);
    fetchDrivers(1, query, false);
  };

  const resolveDriverId = (driver) => {
    return driver?.user_id || driver?.id || driver?.driver_id || driver?.value || driver?.user?.user_id || driver?.user?.id || driver?.data?.user_id || driver?.data?.id || driver?.driver?.user_id || driver?.driver?.id;
  };

  const resetStatusFlow = () => {
    setSelectedReason(null);
    setSelectedBranch(null);
    setSelectedDriver(null);
    setSelectedValue(prev => ({ ...prev, driver: null }));
    setUpdatedStatusNote("");
    setReasonSearchQuery("");
    setShowReasonModal(false);
    setShowBranchModal(false);
    setShowDriverModal(false);
  };

  const openStatusUpdateFlow = () => {
    if (hasFollowUpOrders) {
      Alert.alert(
        translations[language]?.tabs?.orders?.order?.followUpAlertTitle || 'Main order with follow-up packages',
        translations[language]?.tabs?.orders?.order?.followUpAlertMessage || 'This order is the main package and has follow-up packages linked to it. Updating its status may affect all related packages. Please proceed carefully.',
        [{
          text: translations[language]?.tabs?.orders?.order?.ok || 'OK',
          onPress: () => {
            resetStatusFlow();
            setShowStatusUpdateModal(true);
          }
        }]
      );
      return;
    }
    resetStatusFlow();
    setShowStatusUpdateModal(true);
  };

  useEffect(() => {
    if (!showStatusUpdateModal) {
      setSelectedReason(null);
      setSelectedBranch(null);
      setSelectedDriver(null);
      setSelectedValue(prev => ({ ...prev, driver: null }));
      setUpdatedStatusNote("");
      setReasonSearchQuery("");
    }
  }, [showStatusUpdateModal]);

  const handleReasonSelect = (reasonOption) => {
    setSelectedReason(reasonOption);
    setShowReasonModal(false);
    setTimeout(() => setShowConfirmStatusChangeUpdateModal(true), 300);
  };

  const handleBranchSelect = (branchOption) => {
    setSelectedBranch(branchOption);
    setShowBranchModal(false);
    setTimeout(() => setShowConfirmStatusChangeUpdateModal(true), 300);
  };

  const handleDriverSelect = (valueOrUpdater) => {
    const resolvedValue = typeof valueOrUpdater === 'function' ? valueOrUpdater(selectedValue) : valueOrUpdater;
    const driver = resolvedValue?.driver || resolvedValue?.value || resolvedValue;
    setSelectedDriver(driver);
    setSelectedValue(prev => ({ ...prev, driver }));
    setShowDriverModal(false);
    setTimeout(() => setShowConfirmStatusChangeUpdateModal(true), 300);
  };

  const handleStatusUpdate = (newStatusOrUpdater) => {
    setShowStatusUpdateModal(false);
    resetStatusFlow();

    if (typeof newStatusOrUpdater === 'function') {
      const updatedValue = newStatusOrUpdater(selectedValue);
      setSelectedValue(updatedValue);

      const selectedStatus = updatedValue.status?.value;
      if (!selectedStatus) {
        return;
      }

      const statusOption = statusOptions.find(option => option.value === selectedStatus);

      if (statusOption?.requiresDriver) {
        setDriverPage(1);
        setDriverHasMore(true);
        setDriverSearchQuery('');
        fetchDrivers(1, '', false);
        setTimeout(() => setShowDriverModal(true), 100);
      } else if (statusOption?.requiresBranch) {
        fetchBranches();
        setTimeout(() => setShowBranchModal(true), 100);
      } else if (statusOption?.requiresReason) {
        const reasons = statusOption?.reasons || [];
        const onlyOther = reasons.length === 1 && reasons[0].value === 'other';
        if (reasons.length === 0) {
          setTimeout(() => setShowConfirmStatusChangeUpdateModal(true), 100);
        } else if (onlyOther) {
          setSelectedReason(reasons[0]);
          setTimeout(() => setShowConfirmStatusChangeUpdateModal(true), 100);
        } else {
          setTimeout(() => setShowReasonModal(true), 100);
        }
      } else {
        setTimeout(() => setShowConfirmStatusChangeUpdateModal(true), 100);
      }
    } else {
      setSelectedValue(newStatusOrUpdater);
      const selectedStatus = newStatusOrUpdater.status?.value;
      if (!selectedStatus) {
        return;
      }
      const statusOption = statusOptions.find(option => option.value === selectedStatus);
      if (statusOption?.requiresDriver) {
        setDriverPage(1);
        setDriverHasMore(true);
        setDriverSearchQuery('');
        fetchDrivers(1, '', false);
        setTimeout(() => setShowDriverModal(true), 100);
      } else if (statusOption?.requiresBranch) {
        fetchBranches();
        setTimeout(() => setShowBranchModal(true), 100);
      } else if (statusOption?.requiresReason) {
        const reasons = statusOption?.reasons || [];
        const onlyOther = reasons.length === 1 && reasons[0].value === 'other';
        if (reasons.length === 0) {
          setTimeout(() => setShowConfirmStatusChangeUpdateModal(true), 100);
        } else if (onlyOther) {
          setSelectedReason(reasons[0]);
          setTimeout(() => setShowConfirmStatusChangeUpdateModal(true), 100);
        } else {
          setTimeout(() => setShowReasonModal(true), 100);
        }
      } else {
        setTimeout(() => setShowConfirmStatusChangeUpdateModal(true), 100);
      }
    }
  };

  const changeStatusHandler = async () => {
    if (isUpdatingStatus) return;
    try {
      setIsUpdatingStatus(true);
      const selectedStatus = selectedValue?.status?.value;
      const statusOption = statusOptions.find(option => option.value === selectedStatus);
      const manualReason = (UpdatedStatusNote || '').trim();
      const isOther = selectedReason?.value === 'other';
      const finalReason = selectedReason
        ? (isOther ? manualReason : selectedReason.value)
        : (statusOption?.requiresReason ? manualReason : undefined);
      const selectedDriverId = resolveDriverId(selectedDriver) || resolveDriverId(selectedValue?.driver);
      const effectiveBranchId = selectedBranch?.value || (selectedStatus === 'in_branch' && !isAdmin ? defaultUserBranchId : null);

      const updates = {
        order_id: order.order_id,
        status: selectedStatus,
        ...(effectiveBranchId ? { current_branch: effectiveBranchId } : {}),
        ...(statusOption?.requiresDriver && selectedDriverId ? { driver_id: selectedDriverId } : {}),
        ...(finalReason ? { reason: finalReason } : {}),
        ...(isOther ? {} : (manualReason ? { note_content: manualReason } : {})),
        timestamp: new Date().toISOString()
      };

      if (!updates.status) {
        Alert.alert(translations[language]?.tabs?.orders?.order?.missingStatus || 'Missing status');
        setIsUpdatingStatus(false);
        return;
      }

      if (statusOption?.requiresReason && !selectedReason && !manualReason) {
        Alert.alert(translations[language]?.tabs?.orders?.order?.selectReason || 'Reason is required');
        setIsUpdatingStatus(false);
        return;
      }

      if (selectedReason?.value === 'other' && !UpdatedStatusNote.trim()) {
        Alert.alert(translations[language]?.tabs?.orders?.order?.noteRequiredForOther || 'Note required');
        setIsUpdatingStatus(false);
        return;
      }

      if (selectedStatus === 'in_branch') {
        if (isAdmin && !selectedBranch?.value) {
          Alert.alert(translations[language]?.tabs?.orders?.order?.selectBranch || 'Select Branch');
          setIsUpdatingStatus(false);
          return;
        }
        if (!isAdmin && !defaultUserBranchId) {
          Alert.alert(translations[language]?.tabs?.orders?.order?.selectBranch || 'Select Branch');
          setIsUpdatingStatus(false);
          return;
        }
      }

      // Removed strict driver requirement to allow changing status without driver ID as requested
      // if (statusOption?.requiresDriver && !selectedDriverId) {
      //   Alert.alert(translations[language]?.tabs?.orders?.order?.selectDriver || 'Select driver');
      //   setIsUpdatingStatus(false);
      //   return;
      // }

      setShowConfirmStatusChangeUpdateModal(false);

      // If status is on_the_way and we have a driver, update it separately first (logic from Order.js)
      if (selectedStatus === 'on_the_way' && selectedDriverId) {
        try {
          await axios.put(
            `${process.env.EXPO_PUBLIC_API_URL}/api/orders/${order.order_id}`,
            { driver_id: selectedDriverId },
            {
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Accept-Language': language,
              },
              withCredentials: true
            }
          );
        } catch (driverError) {
          console.error('Failed to update driver ID separately:', driverError);
          // We continue to try updating the status even if driver update fails, 
          // or we could choose to abort. Matching the separate call pattern.
        }
      }

      const res = await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}/api/orders/status`,
        { updates },
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Accept-Language': language,
          },
          withCredentials: true
        }
      );

      const data = res.data;
      const failedOrders = Array.isArray(data?.failed_orders) ? data.failed_orders : [];
      const thisOrderId = updates.order_id || order.order_id;
      const thisOrderFailed = failedOrders.includes(thisOrderId);

      if (thisOrderFailed || data.error) {
        Alert.alert(data.details || data.error || translations[language]?.tabs?.orders?.order?.statusChangeError || 'Failed to update status');
      } else {
        setOrder(prev => ({
          ...prev,
          status: selectedValue.status?.label || prev.status,
          status_key: selectedValue.status?.value || prev.status_key,
          status_reason: finalReason || prev.status_reason,
          driver_id: selectedDriverId || prev.driver_id,
          driver: selectedDriver || prev.driver
        }));
        setSelectedReason(null);
        setSelectedBranch(null);
        setSelectedDriver(null);
        setUpdatedStatusNote("");
        Alert.alert(translations[language]?.tabs?.orders?.order?.statusChangeSuccess || 'Status updated successfully');
      }
    } catch (error) {
      const response = error && error.response;
      const serverData = response?.data || {};
      const rawErr = serverData.details || serverData.error || serverData.message || error.message;
      Alert.alert(rawErr || translations[language]?.tabs?.orders?.order?.statusChangeError || 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const fetchOrderData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const formattedOrderId = String(orderId).trim();
      const normalizedOrderId = formattedOrderId.toUpperCase();
      const hasSuffix = /-(B|R)$/i.test(formattedOrderId);
      const baseStripped = formattedOrderId.replace(/-(B|R)$/i, '');
      const numericOnly = (formattedOrderId.match(/\d+/) || [formattedOrderId])[0];
      const baseUrl = process.env.EXPO_PUBLIC_API_URL || '';

      const candidates = [
        formattedOrderId,
        normalizedOrderId,
        ...(hasSuffix ? [] : [
          baseStripped,
          numericOnly,
          formattedOrderId.endsWith('-B') ? formattedOrderId : `${formattedOrderId}-B`,
          formattedOrderId.endsWith('-R') ? formattedOrderId : `${formattedOrderId}-R`,
        ]),
        ...(hasSuffix ? [baseStripped, numericOnly] : [])
      ].filter(Boolean).filter((v, idx, arr) => arr.indexOf(v) === idx);

      const commonOpts = {
        params: { language_code: language },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        withCredentials: true
      };
      const attempts = [];

      const tryFetch = async (endpointLabel, id) => {
        const endpoint = endpointLabel === 'public'
          ? `/api/orders/${encodeURIComponent(id)}/public_info`
          : `/api/orders/${encodeURIComponent(id)}`;
        const url = `${baseUrl}${endpoint}`;
        try {
          const res = await axios.get(url, commonOpts);
          attempts.push({ endpointLabel, id, url, status: res.status, ok: true });
          return res.data;
        } catch (e) {
          const status = e.response?.status;
          const msg = e.response?.data?.message || e.message || '';
          attempts.push({ endpointLabel, id, url, status, ok: false, msg });
          throw e;
        }
      };

      const sequence = [];
      if (publicMode) {
        candidates.forEach(id => sequence.push(['public', id]));
        candidates.forEach(id => sequence.push(['private', id]));
      } else {
        candidates.forEach(id => sequence.push(['private', id]));
        candidates.forEach(id => sequence.push(['public', id]));
      }

      let lastError = null;
      for (const [label, id] of sequence) {
        try {
          const data = await tryFetch(label, id);
          setOrder(data);
          lastError = null;
          break;
        } catch (e) {
          lastError = e;
          const status = e.response?.status;
          const msg = e.response?.data?.message || e.message || '';
          const recoverable = status === 404 || /not found/i.test(msg) || status === 401;
          if (!recoverable) {
            break;
          }
        }
      }

      if (lastError) {
        const errorMessage = lastError.response?.data?.message || lastError.message || 'Could not load order data';
        const isExpected = /not found/i.test(errorMessage) || /authorization token required/i.test(errorMessage);
        (isExpected ? console.warn : console.error)(' [track/index.js] fetchOrderData - Error:', errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Could not load order data';
      const isExpected = /not found/i.test(errorMessage) || /authorization token required/i.test(errorMessage);
      (isExpected ? console.warn : console.error)(' [track/index.js] fetchOrderData - Error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [orderId, language, publicMode]);

  const fetchPrivateNotes = useCallback(async () => {
    try {
      if (!order?.order_id) return;
      const baseUrl = process.env.EXPO_PUBLIC_API_URL || '';
      const url = `${baseUrl}/api/orders/${encodeURIComponent(order.order_id)}/history?language_code=${language}`;
      const res = await axios.get(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Accept-Language': language
        },
        withCredentials: true
      });
      const data = res?.data?.data;
      if (Array.isArray(data)) {
        const notes = data.filter(item => item.field_name === 'private_note');
        setPrivateNotes(notes);
      } else {
        setPrivateNotes([]);
      }
    } catch (e) {
      setPrivateNotes([]);
    }
  }, [order?.order_id, language]);

  const fetchOrderHistory = useCallback(async () => {
    try {
      if (!order?.order_id) return;
      setLoadingHistory(true);
      setHistoryError(null);
      const baseUrl = process.env.EXPO_PUBLIC_API_URL || '';
      const contactTrailsOnly = authUser?.role === 'business';
      const url = `${baseUrl}/api/orders/${encodeURIComponent(order.order_id)}/history?language_code=${language}${contactTrailsOnly ? '&contact_trails=1' : ''}`;
      const res = await axios.get(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Accept-Language': language
        },
        withCredentials: true
      });
      const data = res?.data?.data;
      setHistoryRecords(Array.isArray(data) ? data : []);
    } catch (e) {
      setHistoryError(e);
      setHistoryRecords([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [order?.order_id, language, authUser?.role]);

  useEffect(() => {
    const role = authUser?.role;
    if (!isPublic && order?.order_id && !['driver', 'delivery_company'].includes(role)) {
      fetchOrderHistory();
    }
  }, [isPublic, order?.order_id, fetchOrderHistory, authUser?.role]);

  const contactStats = useMemo(() => {
    const counts = { phoneCalls: 0, whatsapp: 0, sms: 0 };
    historyRecords.forEach(r => {
      const text = [
        r.field_name,
        r.field_label,
        r.new_value_display,
        r.new_value,
        r.change_description
      ].map(v => String(v || '').toLowerCase()).join(' | ');
      const hasWhatsapp = text.includes('whatsapp') || text.includes('واتساب') || text.includes('wa.me') || text.includes('whatsapp://');
      const hasSms = text.includes('sms') || text.includes('رسالة') || text.includes('message');
      const hasCall = text.includes('اتصال') || text.includes('phone') || text.includes('call');
      if (hasWhatsapp) {
        counts.whatsapp++;
      } else if (hasSms) {
        counts.sms++;
      } else if (hasCall) {
        counts.phoneCalls++;
      }
    });
    return counts;
  }, [historyRecords]);

  const contactTrailItems = useMemo(() => {
    const callTemplate = translations[language]?.tabs?.orders?.track?.contactTrailsCallTry || 'Driver tried to call your customer {count} times';
    const whatsappTemplate = translations[language]?.tabs?.orders?.track?.contactTrailsWhatsappTry || 'Driver tried to WhatsApp your customer {count} times';
    const smsTemplate = translations[language]?.tabs?.orders?.track?.contactTrailsSmsTry || 'Driver tried to message your customer {count} times';
    const items = [];
    if (contactStats.phoneCalls > 0) {
      items.push({ icon: 'phone-call', text: callTemplate.replace('{count}', String(contactStats.phoneCalls)) });
    }
    if (contactStats.whatsapp > 0) {
      items.push({ icon: 'message-square', text: whatsappTemplate.replace('{count}', String(contactStats.whatsapp)) });
    }
    if (contactStats.sms > 0) {
      items.push({ icon: 'mail', text: smsTemplate.replace('{count}', String(contactStats.sms)) });
    }
    return items;
  }, [contactStats, language]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      await fetchOrderData();
      if (!isPublic) {
        await fetchPrivateNotes();
        if (authUser?.role === 'business') {
          await fetchOrderHistory();
        }
      }
    } catch (error) {
      console.error(' [track/index.js] onRefresh - Error:', error.message);
    } finally {
      setRefreshing(false);
    }
  }, [fetchOrderData, fetchPrivateNotes, fetchOrderHistory, isPublic, authUser?.role]);

  const scrollToSection = (key) => {
    const y = sectionOffsets[key] ?? 0;
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: Math.max(y - 80, 0), animated: true });
    }
  };
  const handleSectionLayout = (key) => (e) => {
    const layoutY = e?.nativeEvent?.layout?.y;
    if (typeof layoutY !== 'number') return;
    setSectionOffsets(prev => ({ ...prev, [key]: layoutY }));
  };
  const getWhatsappLocal = () => {
    const raw = String(order?.receiver_mobile || '').replace(/\D/g, '');
    if (!raw) return '';
    return raw.startsWith('0') ? raw.slice(1) : raw;
  };
  const buildWhatsappUrl = (prefix) => {
    const local = getWhatsappLocal();
    if (!local) return null;
    const message = translations[language]?.tabs?.orders?.track?.whatsappTemplate || '';
    const text = message ? `?text=${encodeURIComponent(message)}` : '';
    return `https://wa.me/+${prefix}${local}${text}`;
  };
  const openWhatsapp = (prefix) => {
    const url = buildWhatsappUrl(prefix);
    if (!url) return;
    Linking.openURL(url).catch(() => { });
  };
  const printFormats = [
    {
      id: 'A4',
      name: translations[language]?.tabs?.orders?.order?.printFormats?.a4 || 'A4 Full Page',
      description: translations[language]?.tabs?.orders?.order?.printFormats?.a4Desc || 'Standard A4 size with complete order details',
      icon: 'description',
      size: 'A4',
      colorMode: 'blackwhite'
    },
    {
      id: 'waybill_10x10',
      name: translations[language]?.tabs?.orders?.order?.printFormats?.waybill10 || 'Waybill 10×10 cm',
      description: translations[language]?.tabs?.orders?.order?.printFormats?.waybill10Desc || 'Medium waybill format for shipping labels',
      icon: 'local-shipping',
      size: 'waybill_10x10',
      colorMode: 'blackwhite'
    },
    {
      id: 'waybill_5x5',
      name: translations[language]?.tabs?.orders?.order?.printFormats?.waybill5 || 'Waybill 5×5 cm',
      description: translations[language]?.tabs?.orders?.order?.printFormats?.waybill5Desc || 'Compact waybill for small packages',
      icon: 'label',
      size: 'waybill_5x5',
      colorMode: 'blackwhite'
    },
    {
      id: 'receipt',
      name: translations[language]?.tabs?.orders?.order?.printFormats?.receipt || 'Receipt (80mm)',
      description: translations[language]?.tabs?.orders?.order?.printFormats?.receiptDesc || 'Thermal receipt format',
      icon: 'receipt',
      size: 'receipt',
      colorMode: 'blackwhite'
    },
    {
      id: 'label',
      name: translations[language]?.tabs?.orders?.order?.printFormats?.label || 'Address Label',
      description: translations[language]?.tabs?.orders?.order?.printFormats?.labelDesc || 'Address label format (100×50mm)',
      icon: 'bookmark',
      size: 'label',
      colorMode: 'blackwhite'
    }
  ];
  const handlePrintFormatSelect = (format) => {
    setSelectedPrintFormat(format);
    setShowPrintOptionsModal(false);
    generateOrderPDF(format);
  };
  const generateOrderHTML = (currentOrder, currentLanguage, options = {}) => {
    const {
      size = 'A4',
      colorMode = 'blackwhite',
      format = 'full'
    } = options;

    const isRTLLayout = currentLanguage === 'ar' || currentLanguage === 'he';
    const direction = isRTLLayout ? 'rtl' : 'ltr';
    const textAlign = isRTLLayout ? 'right' : 'left';

    const sizeConfigs = {
      'A4': {
        width: '210mm',
        height: '297mm',
        padding: '15px',
        fontSize: '11px',
        headerSize: '16px',
        titleSize: '12px',
        spacing: '8px'
      },
      'waybill_10x10': {
        width: '10cm',
        height: '10cm',
        padding: '5px',
        fontSize: '7px',
        headerSize: '10px',
        titleSize: '8px',
        spacing: '3px'
      },
      'waybill_5x5': {
        width: '5cm',
        height: '5cm',
        padding: '3px',
        fontSize: '5px',
        headerSize: '7px',
        titleSize: '6px',
        spacing: '2px'
      },
      'receipt': {
        width: '80mm',
        height: '200mm',
        padding: '4px',
        fontSize: '8px',
        headerSize: '12px',
        titleSize: '9px',
        spacing: '4px'
      },
      'label': {
        width: '100mm',
        height: '50mm',
        padding: '2px',
        fontSize: '6px',
        headerSize: '8px',
        titleSize: '7px',
        spacing: '2px'
      }
    };

    const config = sizeConfigs[size] || sizeConfigs['A4'];
    const isSmallFormat = ['waybill_5x5', 'label'].includes(size);
    const isMediumFormat = ['waybill_10x10', 'receipt'].includes(size);

    const colorStyles = colorMode === 'blackwhite' ? {
      primaryColor: '#000000',
      secondaryColor: '#333333',
      backgroundColor: '#ffffff',
      borderColor: '#000000',
      gradients: 'none',
      shadows: 'none'
    } : {
      primaryColor: '#4361EE',
      secondaryColor: '#64748B',
      backgroundColor: '#f8fafc',
      borderColor: '#4361EE',
      gradients: 'linear-gradient(135deg, #4361EE, #3B82F6)',
      shadows: '0 2px 8px rgba(67, 97, 238, 0.3)'
    };

    return `
    <!DOCTYPE html>
    <html dir="${direction}">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order #${currentOrder.order_id}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            @page {
                size: ${config.width} ${config.height};
                margin: 0;
            }
            
            body {
                font-family: ${isRTLLayout ? '-apple-system, "SF Pro Text", "Helvetica Neue", Arial, sans-serif' : '-apple-system, "SF Pro Text", "Helvetica Neue", Arial, sans-serif'};
                direction: ${direction};
                text-align: ${textAlign};
                line-height: ${isSmallFormat ? '1.1' : '1.2'};
                color: ${colorStyles.primaryColor};
                padding: ${config.padding};
                background: ${colorStyles.backgroundColor};
                font-size: ${config.fontSize};
                width: ${config.width};
                height: ${config.height};
                overflow: hidden;
                display: flex;
                flex-direction: column;
                page-break-inside: avoid;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .header {
                ${colorStyles.gradients !== 'none' ? `background: ${colorStyles.gradients};` : ''}
                color: ${colorStyles.gradients !== 'none' ? '#ffffff' : colorStyles.primaryColor};
                padding: ${isSmallFormat ? '6px' : '10px'};
                border-radius: ${isSmallFormat ? '4px' : '8px'};
                text-align: center;
                margin-bottom: ${config.spacing};
                ${colorStyles.shadows !== 'none' ? `box-shadow: ${colorStyles.shadows};` : ''}
            }
            
            .company-name {
                font-size: ${config.titleSize};
                font-weight: bold;
                margin-bottom: ${isSmallFormat ? '2px' : '4px'};
            }
            
            .order-id {
                font-size: ${config.headerSize};
                font-weight: bold;
            }
            
            .section {
                margin-bottom: ${config.spacing};
                padding: ${isSmallFormat ? '4px' : '8px'};
                border: 1px solid ${colorStyles.borderColor};
                border-radius: ${isSmallFormat ? '4px' : '6px'};
                ${colorStyles.shadows !== 'none' ? 'box-shadow: 0 1px 3px rgba(0,0,0,0.1);' : ''}
                background: ${colorStyles.backgroundColor};
            }
            
            .section-title {
                font-size: ${config.titleSize};
                font-weight: bold;
                color: ${colorStyles.primaryColor};
                margin-bottom: ${isSmallFormat ? '2px' : '4px'};
                border-bottom: 1px solid ${colorStyles.borderColor};
                padding-bottom: 2px;
            }
            
            .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: ${isSmallFormat ? '2px' : '4px'};
                font-size: ${config.fontSize};
            }
            
            .label {
                font-weight: 500;
                color: ${colorStyles.secondaryColor};
            }
            
            .value {
                font-weight: 600;
                color: ${colorStyles.primaryColor};
                text-align: ${textAlign};
            }
            
            .qr-code {
                text-align: center;
                margin: ${config.spacing} 0;
            }
            
            .status-badge {
                display: inline-block;
                padding: ${isSmallFormat ? '2px 4px' : '4px 8px'};
                border-radius: ${isSmallFormat ? '3px' : '5px'};
                background: ${colorStyles.gradients !== 'none' ? colorStyles.gradients : colorStyles.primaryColor};
                color: #ffffff;
                font-size: ${isSmallFormat ? '5px' : '8px'};
                font-weight: bold;
            }
            
            .footer {
                margin-top: auto;
                text-align: center;
                font-size: ${isSmallFormat ? '4px' : '6px'};
                color: ${colorStyles.secondaryColor};
                border-top: 1px solid ${colorStyles.borderColor};
                padding-top: ${isSmallFormat ? '2px' : '4px'};
            }
            
            .main-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: ${config.spacing};
            }
            
            .two-column {
                display: ${isSmallFormat ? 'block' : 'grid'};
                grid-template-columns: ${isMediumFormat ? '1fr' : '1fr 1fr'};
                gap: ${config.spacing};
            }
            
            @media print {
                body { 
                    padding: 0; 
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                    page-break-inside: avoid;
                }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="company-name">طيار للخدمات اللوجستية والبريد السريع</div>
            <div class="order-id">طلب #${currentOrder.order_id}</div>
        </div>

        <div class="main-content">
            <div class="section">
                <div class="section-title">${translations[currentLanguage]?.tabs?.orders?.track?.receiverInfo || 'Receiver Information'}</div>
                <div class="info-row">
                    <span class="label">${translations[currentLanguage]?.tabs?.orders?.track?.name || 'Name'}:</span>
                    <span class="value">${currentOrder.receiver_name || '-'}</span>
                </div>
                <div class="info-row">
                    <span class="label">${translations[currentLanguage]?.tabs?.orders?.track?.phone || 'Phone'}:</span>
                    <span class="value">${currentOrder.receiver_mobile || '-'}</span>
                </div>
                <div class="info-row">
                    <span class="label">${translations[currentLanguage]?.tabs?.orders?.track?.address || 'Address'}:</span>
                    <span class="value">${currentOrder.receiver_address || '-'}</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">${translations[currentLanguage]?.tabs?.orders?.track?.packageDetails || 'Package Details'}</div>
                <div class="two-column">
                    <div>
                        <div class="info-row">
                            <span class="label">${translations[currentLanguage]?.tabs?.orders?.track?.package || 'Package'}:</span>
                            <span class="value">${currentOrder.order_items || '-'}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">${translations[currentLanguage]?.tabs?.orders?.track?.quantity || 'Quantity'}:</span>
                            <span class="value">${currentOrder.number_of_items || currentOrder.quantity || '-'}</span>
                        </div>
                    </div>
                    <div>
                        <div class="info-row">
                            <span class="label">${translations[currentLanguage]?.tabs?.orders?.track?.weight || 'Weight'}:</span>
                            <span class="value">${currentOrder.order_weight || '-'} kg</span>
                        </div>
                        <div class="info-row">
                            <span class="label">${translations[currentLanguage]?.tabs?.orders?.order?.codValue || 'COD'}:</span>
                            <span class="value">${currentOrder.total_cod_value || currentOrder.cod_value || '-'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">${translations[currentLanguage]?.tabs?.orders?.track?.deliveryStatus || 'Delivery Status'}</div>
                <div class="info-row">
                    <span class="label">${translations[currentLanguage]?.tabs?.orders?.order?.status || 'Status'}:</span>
                    <span class="status-badge">${currentOrder.status || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="label">${translations[currentLanguage]?.tabs?.orders?.track?.branch || 'Branch'}:</span>
                    <span class="value">${currentOrder.current_branch || '-'}</span>
                </div>
            </div>
        </div>

        <div class="footer">
            ${translations[currentLanguage]?.tabs?.orders?.track?.orderTracking || 'Order Tracking'} • ${new Date().toLocaleDateString()}
        </div>
    </body>
    </html>
    `;
  };
  const generateOrderPDF = async (printFormat = null) => {
    try {
      setIsPdfLoading(true);
      const format = printFormat || { size: 'A4', colorMode: 'blackwhite' };
      const htmlContent = generateOrderHTML(order, language, {
        size: format.size,
        colorMode: format.colorMode,
        format: 'full'
      });
      const pdfConfigs = {
        'A4': { width: 612, height: 792, margins: { left: 20, top: 20, right: 20, bottom: 20 } },
        'waybill_10x10': { width: 283, height: 283, margins: { left: 8, top: 8, right: 8, bottom: 8 } },
        'waybill_5x5': { width: 142, height: 142, margins: { left: 4, top: 4, right: 4, bottom: 4 } },
        'receipt': { width: 226, height: 600, margins: { left: 5, top: 5, right: 5, bottom: 5 } },
        'label': { width: 283, height: 142, margins: { left: 3, top: 3, right: 3, bottom: 3 } }
      };
      const config = pdfConfigs[format.size] || pdfConfigs['A4'];
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        width: config.width,
        height: config.height,
        margins: config.margins,
        fileName: `Tayar_Order_${order.order_id}_${format.size}_${new Date().toISOString().split('T')[0]}.pdf`
      });
      if (Platform.OS === 'ios') {
        try {
          await Print.printAsync({
            uri: uri,
            orientation: Print.Orientation.portrait,
            useMarkupFormatter: false
          });
        } catch (printError) {
          const isPrintCancellation =
            printError.message?.includes('Printing did not complete') ||
            printError.message?.includes('cancelled') ||
            printError.message?.includes('User cancelled') ||
            printError.code === 'ERR_PRINT_CANCELLED';
          if (isPrintCancellation) {
            return;
          }
          throw printError;
        }
      } else {
        await Print.printAsync({
          uri: uri,
          printerUrl: uri
        });
      }
    } catch (error) {
      let errorMessage = translations[language]?.common?.pdfGenerationError || "Failed to generate PDF. Please try again.";
      if (Platform.OS === 'ios') {
        if (error.message?.includes('no printer')) {
          errorMessage = translations[language]?.common?.noPrinterError || "No printer available. Please check your printer settings.";
        } else if (error.message?.includes('permission')) {
          errorMessage = translations[language]?.common?.printPermissionError || "Print permission denied. Please allow printing in settings.";
        } else if (error.message?.includes('network')) {
          errorMessage = translations[language]?.common?.networkError || "Network error. Please check your connection and try again.";
        }
      }
      Alert.alert(translations[language]?.common?.error || "Error", errorMessage);
    } finally {
      setIsPdfLoading(false);
    }
  };
  const handlePrintOrder = () => {
    if (isPdfLoading) return;
    setShowPrintOptionsModal(true);
  };
  const handleCancelOrder = async () => {
    Alert.alert(
      translations[language]?.tabs?.orders?.order?.cancelOrderTitle || "Cancel Order",
      translations[language]?.tabs?.orders?.order?.cancelOrderConfirmation || "Are you sure you want to cancel this order? This action cannot be undone.",
      [
        { text: translations[language]?.common?.cancel || "Cancel", style: "cancel" },
        {
          text: translations[language]?.common?.confirm || "Confirm",
          style: "destructive",
          onPress: async () => {
            try {
              const updates = {
                order_id: order.order_id,
                status: 'cancelled',
                timestamp: new Date().toISOString()
              };
              const res = await axios.put(
                `${process.env.EXPO_PUBLIC_API_URL}/api/orders/status`,
                { updates },
                {
                  headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Accept-Language': language,
                  },
                  withCredentials: true
                }
              );
              const data = res.data;
              if (!data.error) {
                setOrder(prev => ({
                  ...prev,
                  status: translations[language]?.tabs?.orders?.order?.states?.cancelled || "Cancelled",
                  status_key: 'cancelled'
                }));
                Alert.alert(translations[language]?.tabs?.orders?.order?.orderCancelledSuccess || "Order cancelled successfully");
              } else {
                Alert.alert(data.details || data.error || translations[language]?.tabs?.orders?.order?.cancelOrderError || "Failed to cancel order");
              }
            } catch (error) {
              Alert.alert(error.message || translations[language]?.tabs?.orders?.order?.cancelOrderError || "Failed to cancel order");
            }
          }
        }
      ]
    );
  };

  const handleCallReceiver = () => {
    const phone = order?.receiver_mobile;
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => { });
  };

  const handleWhatsappReceiver = () => {
    setShowWhatsappOptions(true);
  };

  const handleOpenComplaint = () => {
    router.push({
      pathname: "/(complaints)/open_complaint",
      params: { orderId: orderId }
    });
  };

  const handleEditOrder = () => {
    router.push({
      pathname: "(create)",
      params: { orderId: order.order_id }
    });
  };

  const handleSavePrivateNote = useCallback(async () => {
    const trimmedNote = privateNoteText.trim();
    if (!trimmedNote) {
      Alert.alert(
        translations[language]?.common?.error || 'Error',
        translations[language]?.tabs?.orders?.track?.privateNoteValidation || 'Please enter a note',
        [{ text: translations[language]?.common?.ok || 'OK' }]
      );
      return;
    }

    try {
      setSavingPrivateNote(true);
      const baseUrl = process.env.EXPO_PUBLIC_API_URL || '';
      const url = `${baseUrl}/api/orders/${encodeURIComponent(order.order_id)}/history`;
      await axios.post(url, { note: trimmedNote }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Accept-Language': language
        },
        withCredentials: true
      });
      setPrivateNoteText('');
      setShowPrivateNoteModal(false);
      await fetchPrivateNotes();
      Alert.alert(
        translations[language]?.common?.successMessage || 'Saved',
        translations[language]?.tabs?.orders?.track?.noteSuccess || 'Private note added successfully',
        [{ text: translations[language]?.common?.ok || 'OK' }]
      );
    } catch (e) {
      Alert.alert(
        translations[language]?.common?.error || 'Error',
        translations[language]?.tabs?.orders?.track?.privateNoteFailed || 'Failed to add private note',
        [{ text: translations[language]?.common?.ok || 'OK' }]
      );
    } finally {
      setSavingPrivateNote(false);
    }
  }, [privateNoteText, language, order?.order_id, fetchPrivateNotes]);

  const getStatusInfo = (statusKey) => {
    const statusMap = {
      // Waiting/Processing states
      'waiting': { icon: 'clock', color: '#64748B', background: 'rgba(100, 116, 139, 0.1)', gradient: ['#64748B', '#475569'] },
      'in_branch': { icon: 'archive', color: '#3B82F6', background: 'rgba(59, 130, 246, 0.1)', gradient: ['#3B82F6', '#2563EB'] },
      'in_progress': { icon: 'clock', color: '#8B5CF6', background: 'rgba(139, 92, 246, 0.1)', gradient: ['#8B5CF6', '#7C3AED'] },

      // Error/Rejection states
      'rejected': { icon: 'x-circle', color: '#EF4444', background: 'rgba(239, 68, 68, 0.1)', gradient: ['#EF4444', '#DC2626'] },
      'return_before_delivered_initiated': { icon: 'x-circle', color: '#EF4444', background: 'rgba(239, 68, 68, 0.1)', gradient: ['#EF4444', '#DC2626'] },
      'return_after_delivered_initiated': { icon: 'x-circle', color: '#F97316', background: 'rgba(249, 115, 22, 0.1)', gradient: ['#F97316', '#EA580C'] },

      // Warning states
      'stuck': { icon: 'alert-triangle', color: '#F59E0B', background: 'rgba(245, 158, 11, 0.1)', gradient: ['#F59E0B', '#D97706'] },
      'delayed': { icon: 'alert-triangle', color: '#F59E0B', background: 'rgba(245, 158, 11, 0.1)', gradient: ['#F59E0B', '#D97706'] },
      'reschedule': { icon: 'alert-triangle', color: '#F59E0B', background: 'rgba(245, 158, 11, 0.1)', gradient: ['#F59E0B', '#D97706'] },

      // Delivery states
      'on_the_way': { icon: 'truck', color: '#6366F1', background: 'rgba(99, 102, 241, 0.1)', gradient: ['#6366F1', '#4F46E5'] },

      // Return states
      'returned': { icon: 'corner-up-left', color: '#3B82F6', background: 'rgba(59, 130, 246, 0.1)', gradient: ['#3B82F6', '#2563EB'] },
      'returned_in_branch': { icon: 'corner-up-left', color: '#3B82F6', background: 'rgba(59, 130, 246, 0.1)', gradient: ['#3B82F6', '#2563EB'] },
      'returned_out': { icon: 'corner-up-left', color: '#3B82F6', background: 'rgba(59, 130, 246, 0.1)', gradient: ['#3B82F6', '#2563EB'] },

      // Money states
      'money_in_branch': { icon: 'dollar-sign', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', gradient: ['#10B981', '#059669'] },
      'money_in_process': { icon: 'dollar-sign', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', gradient: ['#10B981', '#059669'] },
      'money_out': { icon: 'dollar-sign', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', gradient: ['#10B981', '#059669'] },
      'business_paid': { icon: 'dollar-sign', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', gradient: ['#10B981', '#059669'] },

      // Success states
      'business_returned_delivered': { icon: 'check-circle', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', gradient: ['#10B981', '#059669'] },
      'delivered': { icon: 'check-circle', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', gradient: ['#10B981', '#059669'] },
      'completed': { icon: 'check-circle', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', gradient: ['#10B981', '#059669'] },

      // Default
      'default': { icon: 'help-circle', color: '#64748B', background: 'rgba(100, 116, 139, 0.1)', gradient: ['#64748B', '#475569'] }
    };

    return statusMap[statusKey] || statusMap.default;
  };

  const handlePhoneCall = (phoneNumber) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const handleCopyToClipboard = async (text, label) => {
    if (text && text !== '-') {
      try {
        await Clipboard.setString(text);
        Alert.alert(
          translations[language].tabs.orders.track.copySuccess || 'Copied!',
          `${label} ${translations[language].tabs.orders.track.copiedToClipboard || 'copied to clipboard'}`,
          [{ text: translations[language].common.ok || 'OK' }]
        );
      } catch (error) {
        Alert.alert(
          translations[language].tabs.orders.track.copyError || 'Error',
          translations[language].tabs.orders.track.copyErrorMessage || 'Failed to copy to clipboard',
          [{ text: translations[language].common.ok || 'OK' }]
        );
      }
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderData();
    }
  }, [fetchOrderData, language, orderId]);

  useEffect(() => {
    if (!isPublic && order?.order_id) {
      fetchPrivateNotes();
    }
  }, [isPublic, order?.order_id, fetchPrivateNotes]);

  if (isLoading) {
    return (
      <View style={[styles.overlay, {
        backgroundColor: colorScheme === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(31, 41, 55, 0.8)'
      }]}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={colorScheme === 'dark' ? '#000000' : colors.primary}
        />
        <View style={[styles.spinnerContainer, {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
        }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.primary }]}>
            {translations[language].tabs.orders.track.loading || 'Loading order...'}
          </Text>
        </View>
      </View>
    );
  }

  // Show error state if there was a problem loading the order
  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={colorScheme === 'dark' ? "light-content" : "dark-content"} backgroundColor={colors.error} />
        <View style={[styles.errorContent, { backgroundColor: colors.card }]}>
          <View style={[styles.errorIconContainer, { backgroundColor: colorScheme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)' }]}>
            <Feather name="alert-circle" size={48} color={colors.error} />
          </View>
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            {translations[language]?.tabs.orders.track.errorTitle || 'Oops!'}
          </Text>
          <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
            {translations[language]?.tabs.orders.track.orderNotFound || 'Order not found or could not be loaded'}
          </Text>
          <Text style={[styles.errorDetail, { color: colors.textTertiary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => router.back()}
          >
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.errorButtonGradient}
            >
              <Feather name="arrow-left" size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.errorButtonText}>
                {translations[language]?.tabs.orders.track.goBack || 'Go Back'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.errorButton, { marginTop: 12 }]}
            onPress={onRefresh}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.errorButtonGradient}
            >
              <Feather name="refresh-cw" size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.errorButtonText}>
                {translations[language]?.tabs.orders.track.tryAgain || 'Try Again'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(
      'en-US',
      { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    );
  };

  // Helper function to format currency values
  const formatCurrencyValue = (value, currency) => {
    // Check if value contains multiple currencies
    if (typeof value === 'string' && (value.includes('ILS:') || value.includes('JOD:') || value.includes('USD:'))) {
      // Split the string by '|' and create a wrapped display
      const currencies = value.split('|').map(item => item.trim());
      return (
        <View style={[styles.currencyContainer]}>
          {currencies.map((curr, idx) => (
            <Text key={idx} style={[styles.currencyText, { color: colors.text }]}>{curr}</Text>
          ))}
        </View>
      );
    }

    // Regular display for simple values - Wrap in Text component
    return <Text style={[styles.costText, { color: colors.text }]}>{value} {currency}</Text>;
  };

  return (
    <>
      <StatusBar barStyle={colorScheme === 'dark' ? "light-content" : "dark-content"} backgroundColor={colors.primary} />
      <ScrollView
        ref={scrollViewRef}
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Hero Header with Order Info */}
        <LinearGradient
          colors={colorScheme === 'dark' ? ['#1E293B', '#0F172A'] : ['#4361EE', '#3730A3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroContainer}
        >
          <View style={styles.heroContent}>
            <View style={styles.orderBadge}>
              <Pressable onPress={() => Clipboard.setString(order.order_id.toString())}>
                <Text style={styles.orderIdLabel}>#{orderId}</Text>
              </Pressable>
            </View>
            <Text style={styles.heroTitle}>{translations[language].tabs.orders.track.orderTracking}</Text>

            {/* Current Status */}
            <TouchableOpacity
              activeOpacity={canChangeStatus ? 0.8 : 1}
              onPress={() => {
                if (canChangeStatus) {
                  openStatusUpdateFlow();
                }
              }}
              disabled={!canChangeStatus}
            >
              <LinearGradient
                colors={(getStatusInfo(order.status_key)?.gradient) || ['#64748B', '#475569']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.currentStatusBadge}
              >
                <Feather
                  name={(getStatusInfo(order.status_key)?.icon) || 'help-circle'}
                  size={18}
                  color="#ffffff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.currentStatusText}>{order.status || '-'} {order.status_reason ? ` | ${order.status_reason}` : ''}</Text>
                {canChangeStatus && (
                  <MaterialIcons name="published-with-changes" size={18} color="#ffffff" style={{ marginLeft: 8 }} />
                )}
              </LinearGradient>
            </TouchableOpacity>

            {!isPublic && authUser?.role === 'business' && contactTrailItems.length > 0 && (
              <View style={styles.contactTrailsHeader}>
                {contactTrailItems.map((item, idx) => (
                  <View
                    key={`${item.icon}-${idx}`}
                    style={[styles.contactTrailsRow]}
                  >
                    <Feather name={item.icon} size={16} color="#E0E7FF" style={styles.contactTrailsIcon} />
                    <Text style={[styles.contactTrailsText]}>{item.text}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Edit Receiver Phone Button */}
            {(
              (!isPublic && ["driver", "delivery_company"].includes(authUser?.role) &&
                ["on_the_way", "reschedule", "rejected", "stuck", "delayed", "driver_responsibility"].includes(order.status_key)) ||
              (!isPublic && authUser?.role === "business" &&
                ["in_branch", "stuck", "delayed", "on_the_way", "reschedule",
                  "dispatched_to_branch", "dispatched_to_driver"].includes(order.status_key))
            ) && (
                <TouchableOpacity
                  style={styles.editPhoneButton}
                  onPress={() => {
                    router.push({
                      pathname: "(edit_receiver_phones)",
                      params: { orderId: order.order_id, editPhoneOnly: true }
                    });
                  }}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.editPhoneButtonGradient}
                  >
                    <Feather name="edit" size={16} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.editPhoneButtonText}>
                      {authUser?.role === "business" &&
                        ["stuck"].includes(order.status_key) ? translations[language]?.tabs?.orders?.order?.resoveIssue || 'Edit Receiver Phone' : translations[language]?.tabs?.orders?.order?.editPhone || 'Edit Receiver Phone'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

            {/* Edit Button */}
            {(
              (!isPublic && authUser?.role === "business" && order.status_key === "waiting") ||
              (!isPublic && !["driver", "delivery_company", "business"].includes(authUser?.role) &&
                ["waiting", "in_branch", "rejected", "stuck", "delayed", "on_the_way",
                  "reschedule", "dispatched_to_branch", "dispatched_to_driver", "delivered",
                  "return_before_delivered_initiated", "return_after_delivered_initiated",
                  "business_returned_delivered", "received", "delivered/received"].includes(order.status_key))
            ) && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    router.push({
                      pathname: "(create)",
                      params: { orderId: order.order_id }
                    });
                  }}
                >
                  <LinearGradient
                    colors={['#4361EE', '#3730A3']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.editButtonGradient}
                  >
                    <Feather name="edit" size={16} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.editButtonText}>
                      {translations[language]?.tabs?.orders?.order?.edit || 'Edit Order'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

            {!isPublic && (
              <TouchableOpacity
                style={styles.actionsButton}
                onPress={() => setShowActionsModal(true)}
              >
                <LinearGradient
                  colors={['#0F172A', '#111827']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionsButtonGradient}
                >
                  <Feather name="more-horizontal" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.actionsButtonText}>
                    {translations[language]?.tabs?.orders?.order?.orderActions || 'Order actions'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Order created info */}
            <View style={styles.heroInfoContainer}>
              {order.order_created_by ? (
                <View style={styles.heroInfoItem}>
                  <Feather name="user" size={14} color="#E0E7FF" style={styles.heroInfoIcon} />
                  <Text style={styles.heroInfoText}>
                    {order.order_created_by}
                  </Text>
                </View>
              ) : null}
              {order.created_at ? (
                <View style={styles.heroInfoItem}>
                  <Feather name="calendar" size={14} color="#E0E7FF" style={styles.heroInfoIcon} />
                  <Text style={styles.heroInfoText}>
                    {formatDate(order.created_at)}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </LinearGradient>

        {/* Main Content */}
        <View style={styles.cardsContainer}>
          {/* Customer Info Card */}
          <View
            style={[styles.modernCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}
            onLayout={handleSectionLayout('receiver')}
          >
            <LinearGradient
              colors={colorScheme === 'dark' ? ['#3B82F6', '#2563EB'] : ['#4F46E5', '#4338CA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.cardHeader]}
            >
              <View style={[styles.cardIconContainer]}>
                <Ionicons name="person" size={22} color="#ffffff" />
              </View>
              <Text style={[styles.cardHeaderText]}>
                {(translations[language].tabs.orders.track.receiverInfo) || 'Receiver Information'}
              </Text>
            </LinearGradient>

            <View style={styles.cardContent}>
              <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.labelContainer]}>
                  <Feather name="user" size={16} color={colors.primary} style={styles.labelIcon} />
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    {translations[language].tabs.orders.track.name}
                  </Text>
                </View>
                <View style={styles.infoValueContainer}>
                  <Text style={[styles.infoValue, {
                    color: colors.text,
                    flex: 1,
                    ...Platform.select({
                      ios: {
                        textAlign: isRTL ? "left" : ""
                      }
                    }),
                  }]}>
                    {order.receiver_name || '-'}
                  </Text>
                  {order.receiver_name && order.receiver_name !== '-' && (
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => handleCopyToClipboard(order.receiver_name, translations[language].tabs.orders.track.name)}
                    >
                      <Feather name="copy" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {order.receiver_mobile ? (
                <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                  <View style={[styles.labelContainer]}>
                    <Feather name="phone" size={16} color={colors.primary} style={styles.labelIcon} />
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      {translations[language].tabs.orders.track.mobile}
                    </Text>
                  </View>
                  <View style={styles.infoValueContainer}>
                    <TouchableOpacity
                      style={[styles.phoneButton, { flex: 1 }]}
                      onPress={() => handlePhoneCall(order.receiver_mobile)}
                    >
                      <Text style={styles.phoneButtonText}>{order.receiver_mobile}</Text>
                      <Feather name="phone-call" size={14} color="#ffffff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => handleCopyToClipboard(order.receiver_mobile, translations[language].tabs.orders.track.mobile)}
                    >
                      <Feather name="copy" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              {order.receiver_second_mobile && (
                <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                  <View style={[styles.labelContainer]}>
                    <Feather name="phone-forwarded" size={16} color={colors.primary} style={styles.labelIcon} />
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      {translations[language].tabs.orders.track.secondMobile}
                    </Text>
                  </View>
                  <View style={styles.infoValueContainer}>
                    <TouchableOpacity
                      style={[styles.phoneButton, { flex: 1 }]}
                      onPress={() => handlePhoneCall(order.receiver_second_mobile)}
                    >
                      <Text style={styles.phoneButtonText}>{order.receiver_second_mobile}</Text>
                      <Feather name="phone-call" size={14} color="#ffffff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => handleCopyToClipboard(order.receiver_second_mobile, translations[language].tabs.orders.track.secondMobile)}
                    >
                      <Feather name="copy" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}


              <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.labelContainer]}>
                  <Feather name="map-pin" size={16} color={colors.primary} style={styles.labelIcon} />
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    {translations[language].tabs.orders.track.location}
                  </Text>
                </View>
                <View style={styles.infoValueContainer}>
                  <Text style={[styles.infoValue, {
                    color: colors.text,
                    flex: 1,
                    ...Platform.select({
                      ios: {
                        textAlign: isRTL ? "left" : ""
                      }
                    }),
                  }]}>
                    {order.receiver_city || '-'}{order.receiver_address ? `, ${order.receiver_address}` : ''}
                  </Text>
                  {(order.receiver_city || order.receiver_address) && (
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => handleCopyToClipboard(
                        `${order.receiver_city || ''}${order.receiver_address ? `, ${order.receiver_address}` : ''}`.trim().replace(/^,\s*/, ''),
                        translations[language].tabs.orders.track.location
                      )}
                    >
                      <Feather name="copy" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.labelContainer]}>
                  <Feather name="home" size={16} color={colors.primary} style={styles.labelIcon} />
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    {translations[language].tabs.orders.track.address}
                  </Text>
                </View>
                <View style={styles.infoValueContainer}>
                  <Text style={[styles.infoValue, {
                    color: colors.text,
                    flex: 1,
                    ...Platform.select({
                      ios: {
                        textAlign: isRTL ? "left" : ""
                      }
                    }),
                  }]}>
                    {order.receiver_address || '-'}
                  </Text>
                  {order.receiver_address && order.receiver_address !== '-' && (
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => handleCopyToClipboard(order.receiver_address, translations[language].tabs.orders.track.address)}
                    >
                      <Feather name="copy" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Sender Info Card */}
          <View
            style={[styles.modernCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}
            onLayout={handleSectionLayout('package')}
          >
            <LinearGradient
              colors={colorScheme === 'dark' ? ['#8B5CF6', '#7C3AED'] : ['#8B5CF6', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.cardHeader]}
            >
              <View style={[styles.cardIconContainer]}>
                <Ionicons name="business" size={22} color="#ffffff" />
              </View>
              <Text style={[styles.cardHeaderText]}>
                {translations[language].tabs.orders.track.senderInfo || 'Sender Information'}
              </Text>
            </LinearGradient>

            <View style={styles.cardContent}>
              <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.labelContainer]}>
                  <Feather name="briefcase" size={16} color="#7C3AED" style={styles.labelIcon} />
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    {translations[language].tabs.orders.track.name}
                  </Text>
                </View>
                <View style={styles.infoValueContainer}>
                  <Text style={[styles.infoValue, {
                    color: colors.text,
                    flex: 1,
                    ...Platform.select({
                      ios: {
                        textAlign: isRTL ? "left" : ""
                      }
                    }),
                  }]}>
                    {order.sender || order.sender_name || '-'}
                  </Text>
                  {order.sender && order.sender !== '-' && (
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => handleCopyToClipboard(order.sender, translations[language].tabs.orders.track.name)}
                    >
                      <Feather name="copy" size={16} color="#7C3AED" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {order.sender_mobile ? (<View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.labelContainer]}>
                  <Feather name="phone" size={16} color="#7C3AED" style={styles.labelIcon} />
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    {translations[language].tabs.orders.track.mobile}
                  </Text>
                </View>
                <View style={styles.infoValueContainer}>
                  <TouchableOpacity
                    style={[styles.phoneButton, { backgroundColor: '#7C3AED', flex: 1 }]}
                    onPress={() => handlePhoneCall(order.sender_mobile)}
                  >
                    <Text style={[styles.phoneButtonText]}>{order.sender_mobile}</Text>
                    <Feather name="phone-call" size={14} color="#ffffff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => handleCopyToClipboard(order.sender_mobile, translations[language].tabs.orders.track.mobile)}
                  >
                    <Feather name="copy" size={16} color="#7C3AED" />
                  </TouchableOpacity>
                </View>
              </View>) : null}

              {order.sender_second_mobile && (
                <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                  <View style={[styles.labelContainer]}>
                    <Feather name="phone-forwarded" size={16} color="#7C3AED" style={styles.labelIcon} />
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      {translations[language].tabs.orders.track.secondMobile}
                    </Text>
                  </View>
                  <View style={styles.infoValueContainer}>
                    <TouchableOpacity
                      style={[styles.phoneButton, { backgroundColor: '#7C3AED', flex: 1 }]}
                      onPress={() => handlePhoneCall(order.sender_second_mobile)}
                    >
                      <Text style={[styles.phoneButtonText]}>{order.sender_second_mobile}</Text>
                      <Feather name="phone-call" size={14} color="#ffffff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => handleCopyToClipboard(order.sender_second_mobile, translations[language].tabs.orders.track.secondMobile)}
                    >
                      <Feather name="copy" size={16} color="#7C3AED" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.labelContainer]}>
                  <Feather name="map-pin" size={16} color="#7C3AED" style={styles.labelIcon} />
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    {translations[language].tabs.orders.track.location}
                  </Text>
                </View>
                <View style={styles.infoValueContainer}>
                  <Text style={[styles.infoValue, {
                    color: colors.text,
                    flex: 1,
                    ...Platform.select({
                      ios: {
                        textAlign: isRTL ? "left" : ""
                      }
                    }),
                  }]}>
                    {order.sender_city || '-'}{order.sender_address ? `, ${order.sender_address}` : ''}
                  </Text>
                  {(order.sender_city || order.sender_address) && (
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => handleCopyToClipboard(
                        `${order.sender_city || ''}${order.sender_address ? `, ${order.sender_address}` : ''}`.trim().replace(/^,\s*/, ''),
                        translations[language].tabs.orders.track.location
                      )}
                    >
                      <Feather name="copy" size={16} color="#7C3AED" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

            </View>
          </View>

          {/* Order Details Card */}
          <View
            style={[styles.modernCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}
          >
            <LinearGradient
              colors={['#F97316', '#EA580C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.cardHeader]}
            >
              <View style={[styles.cardIconContainer]}>
                <Feather name="info" size={22} color="#ffffff" />
              </View>
              <Text style={[styles.cardHeaderText]}>
                {translations[language].tabs.orders.track.orderDetails || 'Order Details'}
              </Text>
            </LinearGradient>

            <View style={styles.cardContent}>
              <View style={styles.detailsGrid}>
                <View style={[styles.detailsGridItem, { backgroundColor: colorScheme === 'dark' ? colors.cardAlt : '#F9FAFB' }]}>
                  <View style={[styles.detailsIconContainer, { backgroundColor: colorScheme === 'dark' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(249, 115, 22, 0.1)' }]}>
                    <Feather name="package" size={18} color="#F97316" />
                  </View>
                  <Text style={[styles.detailsLabel, { color: colors.textSecondary }]}>
                    {translations[language].tabs.orders.track.orderType}
                  </Text>
                  <Text style={[styles.detailsValue, { color: colors.text }]}>{order.order_type || '-'}</Text>
                </View>

                {order.payment_type ? (
                  <View style={[styles.detailsGridItem, { backgroundColor: colorScheme === 'dark' ? colors.cardAlt : '#F9FAFB' }]}>
                    <View style={[styles.detailsIconContainer, { backgroundColor: colorScheme === 'dark' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(249, 115, 22, 0.1)' }]}>
                      <Feather name="credit-card" size={18} color="#F97316" />
                    </View>
                    <Text style={[styles.detailsLabel, { color: colors.textSecondary }]}>
                      {translations[language].tabs.orders.track.paymentType}
                    </Text>
                    <Text style={[styles.detailsValue, { color: colors.text }]}>{order.payment_type}</Text>
                  </View>
                ) : null}

                {order.reference_id ? (
                  <View style={[styles.detailsGridItem, { backgroundColor: colorScheme === 'dark' ? colors.cardAlt : '#F9FAFB' }]}>
                    <View style={[styles.detailsIconContainer, { backgroundColor: colorScheme === 'dark' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(249, 115, 22, 0.1)' }]}>
                      <Feather name="hash" size={18} color="#F97316" />
                    </View>
                    <Text style={[styles.detailsLabel, { color: colors.textSecondary }]}>
                      {translations[language].tabs.orders.track.referenceId}
                    </Text>
                    <Text style={[styles.detailsValue, { color: colors.text }]}>{order.reference_id}</Text>
                  </View>
                ) : <></>}

                {order.items_type ? (
                  <View style={[styles.detailsGridItem, { backgroundColor: colorScheme === 'dark' ? colors.cardAlt : '#F9FAFB' }]}>
                    <View style={[styles.detailsIconContainer, { backgroundColor: colorScheme === 'dark' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(249, 115, 22, 0.1)' }]}>
                      <Feather name="box" size={18} color="#F97316" />
                    </View>
                    <Text style={[styles.detailsLabel, { color: colors.textSecondary }]}>
                      {translations[language].tabs.orders.track.itemType}
                    </Text>
                    <Text style={[styles.detailsValue, { color: colors.text }]}>{order.items_type}</Text>
                  </View>
                ) : null}
              </View>

              {!isPublic && order.driver ? (
                <View style={[styles.driverContainer, { backgroundColor: colorScheme === 'dark' ? 'rgba(249, 115, 22, 0.1)' : 'rgba(249, 115, 22, 0.05)' }]}>
                  <View style={styles.driverHeader}>
                    <View style={[styles.driverIconContainer, { backgroundColor: colorScheme === 'dark' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(249, 115, 22, 0.1)' }]}>
                      <Feather name="truck" size={18} color="#F97316" />
                    </View>
                    <Text style={[styles.driverHeaderText, { color: '#F97316' }]}>
                      {translations[language].tabs.orders.track.driver}
                    </Text>
                  </View>

                  <View style={styles.driverContent}>
                    <Text style={[styles.driverName, { color: colors.text }]}>
                      {typeof order.driver === 'object'
                        ? (order.driver.name || order.driver.user_name || order.driver.full_name || order.driver.common?.unknown || "Unknown")
                        : order.driver}
                    </Text>
                    {order.driver_mobile && (
                      <TouchableOpacity
                        style={[styles.phoneButton, { backgroundColor: '#F97316' }]}
                        onPress={() => handlePhoneCall(order.driver_mobile)}
                      >
                        <Text style={styles.phoneButtonText}>{order.driver_mobile}</Text>
                        <Feather name="phone-call" size={14} color="#ffffff" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ) : null}
            </View>
          </View>

          {/* Financial Details Card */}
          {(!isPublic && (order.total_cod_value || order.delivery_fee || order.total_net_value || (order.checks && order.checks.length > 0))) ? (
            <View
              style={[styles.modernCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}
              onLayout={handleSectionLayout('timeline')}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.cardHeader]}
              >
                <View style={[styles.cardIconContainer]}>
                  <FontAwesome name="money" size={22} color="#ffffff" />
                </View>
                <Text style={[styles.cardHeaderText]}>
                  {translations[language].tabs.orders.track.financialDetails || 'Financial Details'}
                </Text>
              </LinearGradient>

              <View style={styles.cardContent}>
                <View style={styles.financialSummary}>
                  <View style={[styles.financialItem, { borderBottomColor: colors.border }]}>
                    <View style={[styles.financialIconContainer, { backgroundColor: colorScheme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)' }]}>
                      <Feather name="dollar-sign" size={18} color="#10B981" />
                    </View>
                    <Text style={[styles.financialLabel, {
                      color: colors.textSecondary,
                      ...Platform.select({
                        ios: {
                          textAlign: isRTL ? "left" : ""
                        }
                      }),
                    }]}>
                      {translations[language].tabs.orders.track.codValue}
                    </Text>
                    <Text style={[styles.financialValue, { color: colors.text }]}>{order.total_cod_value}</Text>
                  </View>

                  {!["driver", "delivery_company"].includes(authUser?.role) && (<View style={[styles.financialItem, { borderBottomColor: colors.border }]}>
                    <View style={[styles.financialIconContainer, { backgroundColor: colorScheme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)' }]}>
                      <Feather name="truck" size={18} color="#10B981" />
                    </View>
                    <Text style={[styles.financialLabel, {
                      color: colors.textSecondary,
                      ...Platform.select({
                        ios: {
                          textAlign: isRTL ? "left" : ""
                        }
                      }),
                    }]}>
                      {translations[language].tabs.orders.track.deliveryFee}
                    </Text>
                    <Text style={[styles.financialValue, { color: colors.text }]}>{order.delivery_fee}</Text>
                  </View>)}

                  {!["driver", "delivery_company"].includes(authUser?.role) && (<View style={[styles.financialItem, styles.highlightedFinancialItem, { backgroundColor: colorScheme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)' }]}>
                    <View style={[styles.financialIconContainer, { backgroundColor: colorScheme === 'dark' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.15)' }]}>
                      <Feather name="check-circle" size={18} color="#10B981" />
                    </View>
                    <Text style={[styles.financialLabelHighlight, {
                      ...Platform.select({
                        ios: {
                          textAlign: isRTL ? "left" : ""
                        }
                      }),
                    }]}>
                      {translations[language].tabs.orders.track.netValue}
                    </Text>
                    <Text style={styles.financialValueHighlight}>{order.total_net_value}</Text>
                  </View>)}
                </View>

                {/* Checks Section */}
                {order.checks && order.checks.length > 0 && (
                  <View style={[styles.checksContainer]}>
                    <LinearGradient
                      colors={colorScheme === 'dark' ? ['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.1)'] : ['rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.05)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.checksHeader}
                    >
                      <Feather name="credit-card" size={18} color="#10B981" style={{ marginRight: 10 }} />
                      <Text style={[styles.checksHeaderText, { color: '#10B981' }]}>
                        {translations[language].tabs.orders.track.checks || 'Checks'}
                      </Text>
                    </LinearGradient>

                    {order.checks.map((check, index) => (
                      <View key={index} style={[styles.checkItem, { backgroundColor: colorScheme === 'dark' ? colors.cardAlt : '#F9FAFB' }]}>
                        <View style={[styles.checkHeader, { borderBottomColor: colors.border }]}>
                          <Text style={[styles.checkNumberLabel, { color: colors.text }]}>
                            {translations[language].tabs.orders.track.checkNumber}: {check.number || '-'}
                          </Text>
                        </View>

                        <View style={styles.checkDetails}>
                          <View style={[styles.checkDetailItem]}>
                            <Feather name="dollar-sign" size={14} color="#10B981" style={styles.checkDetailIcon} />
                            <Text style={[styles.checkDetailLabel, { color: colors.textSecondary }]}>
                              {translations[language].tabs.orders.track.checkValue}:
                            </Text>
                            <Text style={[styles.checkDetailValue, { color: colors.text }]}>
                              {formatCurrencyValue(check.value, check.currency)}
                            </Text>
                          </View>

                          <View style={[styles.checkDetailItem]}>
                            <Feather name="calendar" size={14} color="#10B981" style={styles.checkDetailIcon} />
                            <Text style={[styles.checkDetailLabel, { color: colors.textSecondary }]}>
                              {translations[language].tabs.orders.track.checkDate}:
                            </Text>
                            <Text style={[styles.checkDetailValue, { color: colors.text }]}>
                              {formatDate(check.date)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          ) : null}

          {/* Notes Section if applicable */}
          {!isPublic && order.note_content ? (
            <View style={[styles.modernCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.cardHeader]}
              >
                <View style={[styles.cardIconContainer]}>
                  <Feather name="file-text" size={22} color="#ffffff" />
                </View>
                <Text style={[styles.cardHeaderText]}>
                  {translations[language].tabs.orders.track.notes || 'Notes'}
                </Text>
              </LinearGradient>

              <View style={styles.cardContent}>
                <View style={[styles.noteContainer, { backgroundColor: colorScheme === 'dark' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)' }]}>
                  <Feather name="message-square" size={20} color="#F59E0B" style={styles.noteIcon} />
                  <Text style={[styles.noteText, {
                    color: colors.text,
                    ...Platform.select({
                      ios: {
                        textAlign: isRTL ? "left" : ""
                      }
                    }),
                  }]}>
                    {order.note_content}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* Package Info Card */}
          {(!isPublic && (order?.order_items || order?.number_of_items || order?.order_weight || order?.received_items || order?.received_quantity)) ? (
            <View style={[styles.modernCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
              <LinearGradient
                colors={colorScheme === 'dark' ? ['#3B82F6', '#2563EB'] : ['#4361EE', '#3730A3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.cardHeader]}
              >
                <View style={[styles.cardIconContainer]}>
                  <Feather name="package" size={22} color="#ffffff" />
                </View>
                <Text style={[styles.cardHeaderText]}>
                  {translations[language].tabs.orders.track.packageDetails || 'Package Details'}
                </Text>
              </LinearGradient>

              <View style={styles.cardContent}>
                <View style={[styles.packageWrapper]}>
                  <View>
                    <View style={[styles.packageImagePlaceholder, { backgroundColor: colorScheme === 'dark' ? 'rgba(67, 97, 238, 0.2)' : 'rgba(67, 97, 238, 0.1)' }]}>
                      <Feather name="box" size={32} color="#4361EE" />
                    </View>
                  </View>

                  <View style={styles.packageInfo}>
                    <View style={[styles.packageInfoRow, { borderBottomColor: colors.border }]}>
                      <View style={[styles.packageLabelContainer]}>
                        <Feather name="box" size={16} color="#4361EE" style={styles.packageLabelIcon} />
                        <Text style={[styles.packageInfoLabel, { color: colors.textSecondary }]}>
                          {translations[language].tabs.orders.track.package}
                        </Text>
                      </View>
                      <Text style={[styles.packageInfoValue, {
                        color: colors.text,
                        ...Platform.select({
                          ios: {
                            textAlign: isRTL ? "left" : ""
                          }
                        }),
                      }]}>
                        {order?.order_items ? order?.order_items : translations[language].tabs.orders.track.unknown}
                      </Text>
                    </View>

                    <View style={[styles.packageInfoRow, { borderBottomColor: colors.border }]}>
                      <View style={[styles.packageLabelContainer]}>
                        <Feather name="hash" size={16} color="#4361EE" style={styles.packageLabelIcon} />
                        <Text style={[styles.packageInfoLabel, { color: colors.textSecondary }]}>
                          {translations[language].tabs.orders.track.quantity}
                        </Text>
                      </View>
                      <Text style={[styles.packageInfoValue, {
                        color: colors.text,
                        ...Platform.select({
                          ios: {
                            textAlign: isRTL ? "left" : ""
                          }
                        }),
                      }]}>
                        {displayQuantity}
                      </Text>
                    </View>

                    {displayPackageItems.length > 0 && (
                      <View style={styles.packageItemsBlock}>
                        <View style={styles.packageItemsHeader}>
                          <Text style={[styles.packageItemsTitle, { color: colors.text }]}>
                            {translations[language]?.tabs?.orders?.track?.packageItems || translations[language]?.tabs?.orders?.order?.packageItemsTitle || 'Package items'}
                          </Text>
                          <View style={styles.packageItemsBadge}>
                            <Text style={styles.packageItemsBadgeText}>{followUpCount}</Text>
                          </View>
                        </View>
                        <View style={styles.packageItemsGrid}>
                          {displayPackageItems.map((item, index) => (
                            <View key={`${item?.qr_id || 'package'}-${index}`} style={[styles.packageItemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                              <View style={styles.packageItemCardHeader}>
                                <Text style={[styles.packageItemNumber, { color: colors.textSecondary }]}>
                                  #{item?.sequence || index + 2}
                                </Text>
                                <MaterialCommunityIcons name="qrcode" size={16} color="#4F46E5" />
                              </View>
                              <Text style={[styles.packageItemQr, { color: colors.text }]}>
                                {item?.qr_id || '-'}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    <View style={[styles.packageInfoRow, { borderBottomColor: colors.border }]}>
                      <View style={[styles.packageLabelContainer]}>
                        <Feather name="anchor" size={16} color="#4361EE" style={styles.packageLabelIcon} />
                        <Text style={[styles.packageInfoLabel, { color: colors.textSecondary }]}>
                          {translations[language].tabs.orders.track.weight}
                        </Text>
                      </View>
                      <Text style={[styles.packageInfoValue, {
                        color: colors.text,
                        ...Platform.select({
                          ios: {
                            textAlign: isRTL ? "left" : ""
                          }
                        }),
                      }]}>
                        {order?.order_weight || 0} kg
                      </Text>
                    </View>

                    {order.received_items ? (
                      <View style={[styles.packageInfoRow, { borderBottomColor: colors.border }]}>
                        <View style={styles.packageLabelContainer}>
                          <Feather name="check-square" size={16} color="#4361EE" style={styles.packageLabelIcon} />
                          <Text style={[styles.packageInfoLabel, { color: colors.textSecondary }]}>
                            {translations[language].tabs.orders.track.receivedItems}
                          </Text>
                        </View>
                        <Text style={[styles.packageInfoValue, {
                          color: colors.text,
                          ...Platform.select({
                            ios: {
                              textAlign: isRTL ? "left" : ""
                            }
                          }),
                        }]}>
                          {order?.received_items}
                        </Text>
                      </View>
                    ) : <></>}

                    {order.received_quantity ? (
                      <View style={[styles.packageInfoRow, { borderBottomColor: colors.border }]}>
                        <View style={styles.packageLabelContainer}>
                          <Feather name="check-circle" size={16} color="#4361EE" style={styles.packageLabelIcon} />
                          <Text style={[styles.packageInfoLabel, { color: colors.textSecondary }]}>
                            {translations[language].tabs.orders.track.receivedQuantity}
                          </Text>
                        </View>
                        <Text style={[styles.packageInfoValue, {
                          color: colors.text,
                          ...Platform.select({
                            ios: {
                              textAlign: isRTL ? "left" : ""
                            }
                          }),
                        }]}>
                          {order?.received_quantity}
                        </Text>
                      </View>
                    ) : <></>}
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          {/* Delivery Status Timeline */}
          <View style={[styles.modernCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
            <LinearGradient
              colors={['#6366F1', '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.cardHeader]}
            >
              <View style={[styles.cardIconContainer]}>
                <MaterialCommunityIcons name="timeline-clock" size={22} color="#ffffff" />
              </View>
              <Text style={[styles.cardHeaderText]}>
                {translations[language].tabs.orders.track.deliveryStatus}
              </Text>
            </LinearGradient>

            {/* Timeline */}
            <View style={[
              styles.timelineContainer,
              { backgroundColor: colors.card }
            ]}>
              <View style={[
                styles.timelineLine,
                { backgroundColor: colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)' }
              ]}></View>

              {order.order_status_history?.map((item, index) => {
                const statusInfo = getStatusInfo(item.status_key);
                const isLast = index === order.order_status_history.length - 1;
                const date = new Date(item.created_at);

                return (
                  <View
                    key={index}
                    style={[
                      styles.timelineItem,
                      isLast && styles.lastTimelineItem
                    ]}
                  >
                    <LinearGradient
                      colors={statusInfo.gradient}
                      style={[
                        styles.timelineIconContainer
                      ]}
                    >
                      <Feather name={statusInfo.icon} size={20} color="#ffffff" />
                    </LinearGradient>
                    <View style={[styles.timelineContent, { backgroundColor: colorScheme === 'dark' ? colors.cardAlt : '#F9FAFB' }]}>
                      <Text style={[styles.timelineStatus, {
                        color: colors.text,
                        ...Platform.select({
                          ios: {
                            textAlign: isRTL ? "left" : ""
                          }
                        }),
                      }]}>
                        {item.new_status}
                      </Text>
                      {!isPublic && item?.status_reason ? (
                        <View style={[styles.timelineDetailsContainer]}>
                          <Feather name="alert-circle" size={14} color="#6366F1" />
                          <Text style={[styles.timelineDetails, {
                            color: colors.textSecondary, ...Platform.select({
                              ios: {
                                textAlign: isRTL ? "left" : ""
                              }
                            })
                          }]}>
                            {translations[language]?.tabs?.orders?.track?.reason || 'Reason'}: {item.status_reason}
                          </Text>
                        </View>
                      ) : null}
                      {item.note_content ? (
                        <View style={[styles.timelineDetailsContainer]}>
                          <Feather name="message-square" size={14} color="#6366F1" />
                          <Text style={[styles.timelineDetails, {
                            color: colors.textSecondary, ...Platform.select({
                              ios: {
                                textAlign: isRTL ? "left" : ""
                              }
                            })
                          }]}>
                            {item.note_content}
                          </Text>
                        </View>
                      ) : null}

                      <View style={[styles.timelineDetailsContainer]}>
                        <Feather name="map-pin" size={14} color="#6366F1" />
                        <Text style={[styles.timelineDetails, {
                          color: colors.textSecondary, ...Platform.select({
                            ios: {
                              textAlign: isRTL ? "left" : ""
                            }
                          })
                        }]}>
                          {item.branch}
                        </Text>
                      </View>

                      {item.to_branch ? (
                        <View style={[styles.timelineDetailsContainer]}>
                          <Feather name="git-branch" size={14} color="#6366F1" />
                          <Text style={[styles.timelineDetails, {
                            color: colors.textSecondary, ...Platform.select({
                              ios: {
                                textAlign: isRTL ? "left" : ""
                              }
                            })
                          }]}>
                            {translations[language]?.tabs?.orders?.track?.toBranch || 'To Branch'}: {item.to_branch}
                          </Text>
                        </View>
                      ) : null}

                      {!isPublic && item.driver ? (
                        <View style={[styles.timelineDetailsContainer]}>
                          <Feather name="user" size={14} color="#6366F1" />
                          <Text style={[styles.timelineDetails, {
                            color: colors.textSecondary, ...Platform.select({
                              ios: {
                                textAlign: isRTL ? "left" : ""
                              }
                            })
                          }]}>
                            {translations[language]?.tabs?.orders?.track?.driver || 'Driver'}: {item.driver}
                          </Text>
                        </View>
                      ) : null}

                      {!isPublic && authUser?.role !== 'business' && item.changed_by ? (
                        <View style={[styles.timelineDetailsContainer]}>
                          <Feather name="user-check" size={14} color="#6366F1" />
                          <Text style={[styles.timelineDetails, {
                            color: colors.textSecondary, ...Platform.select({
                              ios: {
                                textAlign: isRTL ? "left" : ""
                              }
                            })
                          }]}>
                            {translations[language]?.tabs?.orders?.track?.changedBy || 'Changed By'}: {item.changed_by}
                          </Text>
                        </View>
                      ) : null}

                      <View style={[styles.timelineDateContainer]}>
                        <View style={styles.timelineDateItem}>
                          <Feather name="calendar" size={12} color={colors.textTertiary} />
                          <Text style={[styles.timelineDate, { color: colors.textTertiary }]}>
                            {date.toLocaleDateString(
                              'en-US',
                              { year: 'numeric', month: 'short', day: 'numeric' }
                            )}
                          </Text>
                        </View>
                        <View style={styles.timelineDateItem}>
                          <Feather name="clock" size={12} color={colors.textTertiary} />
                          <Text style={[styles.timelineDate, { color: colors.textTertiary }]}>
                            {date.toLocaleTimeString(
                              'en-US',
                              { hour: '2-digit', minute: '2-digit' }
                            )}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {!isPublic && !['business', 'driver', 'delivery_company'].includes(authUser?.role) && (
            <View style={[styles.modernCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
              <LinearGradient
                colors={['#0EA5E9', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.cardHeader]}
              >
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.cardIconContainer]}>
                    <Feather name="file" size={22} color="#ffffff" />
                  </View>
                  <Text style={[styles.cardHeaderText]}>
                    {translations[language]?.tabs?.orders?.track?.orderRecord || 'Order Record'}
                  </Text>
                </View>
              </LinearGradient>
              <View style={[
                styles.timelineContainer,
                { backgroundColor: colors.card }
              ]}>
                {loadingHistory ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
                      {translations[language]?.tabs?.orders?.track?.loading || 'Loading...'}
                    </Text>
                  </View>
                ) : historyError ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Feather name="alert-triangle" size={40} color={colors.warning} />
                    <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
                      {(historyError?.message || translations[language]?.common?.error || 'Error')}
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={[
                      styles.timelineLine,
                      { backgroundColor: colorScheme === 'dark' ? 'rgba(14, 165, 233, 0.3)' : 'rgba(14, 165, 233, 0.2)' }
                    ]}></View>
                    {historyRecords
                      .slice()
                      .sort((a, b) => {
                        const aIsNote = a.field_name === 'private_note' || !!a.note_content || !!a.new_value_display;
                        const bIsNote = b.field_name === 'private_note' || !!b.note_content || !!b.new_value_display;
                        if (aIsNote && !bIsNote) return -1;
                        if (!aIsNote && bIsNote) return 1;
                        return 0;
                      })
                      .map((rec, idx) => {
                        const date = new Date(rec.updated_at || rec.created_at);
                        const title = rec.field_label || rec.field_name || '';
                        const content = rec.note_content || rec.new_value_display || rec.change_description || '';
                        return (
                          <View key={idx} style={[styles.timelineItem, idx === historyRecords.length - 1 && styles.lastTimelineItem]}>
                            <LinearGradient colors={['#0EA5E9', '#2563EB']} style={styles.timelineIconContainer}>
                              <Feather name={content ? 'file-text' : 'edit'} size={20} color="#ffffff" />
                            </LinearGradient>
                            <View style={[styles.timelineContent, { backgroundColor: colorScheme === 'dark' ? colors.cardAlt : '#F9FAFB' }]}>
                              <Text style={[styles.timelineStatus, {
                                color: colors.text,
                                ...Platform.select({
                                  ios: {
                                    textAlign: isRTL ? "left" : ""
                                  }
                                }),
                              }]}>
                                {title}
                                {content ? `: ${content}` : ''}
                              </Text>
                              {rec.updated_by_name ? (
                                <View style={[styles.timelineDetailsContainer]}>
                                  <Feather name="user-check" size={14} color="#0EA5E9" />
                                  <Text style={[styles.timelineDetails, {
                                    color: colors.textSecondary, ...Platform.select({
                                      ios: {
                                        textAlign: isRTL ? "left" : ""
                                      }
                                    })
                                  }]}>
                                    {translations[language]?.tabs?.orders?.track?.changedBy || 'Changed By'}: {rec.updated_by_name}
                                  </Text>
                                </View>
                              ) : null}
                              {(rec.updated_at || rec.created_at) ? (
                                <View style={[styles.timelineDateContainer]}>
                                  <View style={styles.timelineDateItem}>
                                    <Feather name="calendar" size={12} color={colors.textTertiary} />
                                    <Text style={[styles.timelineDate, { color: colors.textTertiary }]}>
                                      {date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </Text>
                                  </View>
                                  <View style={styles.timelineDateItem}>
                                    <Feather name="clock" size={12} color={colors.textTertiary} />
                                    <Text style={[styles.timelineDate, { color: colors.textTertiary }]}>
                                      {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                  </View>
                                </View>
                              ) : null}
                            </View>
                          </View>
                        );
                      })}
                    {!historyRecords || historyRecords.length === 0 ? (
                      <View style={{ padding: 20, alignItems: 'center' }}>
                        <Feather name="slash" size={40} color={colors.textTertiary} />
                        <Text style={{ color: colors.textTertiary, marginTop: 8 }}>
                          {translations[language]?.tabs?.orders?.track?.noHistory || 'No history'}
                        </Text>
                      </View>
                    ) : null}
                  </>
                )}
              </View>
            </View>
          )}

          {/* Private Notes */}
          {!isPublic && authUser?.role !== 'business' && (
            <View style={[styles.modernCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
              <LinearGradient
                colors={['#7C3AED', '#6D28D9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.cardHeader]}
              >
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.cardIconContainer]}>
                    <Feather name="file-text" size={22} color="#ffffff" />
                  </View>
                  <Text style={[styles.cardHeaderText]}>
                    {translations[language]?.tabs?.orders?.track?.privateNotes || 'Private Notes'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.privateNoteAddButton}
                  onPress={() => setShowPrivateNoteModal(true)}
                  activeOpacity={0.8}
                >
                  <Feather name="plus" size={16} color="#ffffff" />
                </TouchableOpacity>
              </LinearGradient>
              <View style={[
                styles.timelineContainer,
                { backgroundColor: colors.card }
              ]}>
                <View style={[
                  styles.timelineLine,
                  { backgroundColor: colorScheme === 'dark' ? 'rgba(124, 58, 237, 0.3)' : 'rgba(124, 58, 237, 0.2)' }
                ]}></View>
                {privateNotes
                  .slice()
                  .sort((a, b) => {
                    const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
                    const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
                    return aTime - bTime;
                  })
                  .map((note, idx) => {
                    const date = new Date(note.updated_at || note.created_at);
                    return (
                      <View key={idx} style={[styles.timelineItem, idx === privateNotes.length - 1 && styles.lastTimelineItem]}>
                        <LinearGradient colors={['#7C3AED', '#6D28D9']} style={styles.timelineIconContainer}>
                          <Feather name="message-square" size={20} color="#ffffff" />
                        </LinearGradient>
                        <View style={[styles.timelineContent, { backgroundColor: colorScheme === 'dark' ? colors.cardAlt : '#F9FAFB' }]}>
                          <Text style={[styles.timelineStatus, {
                            color: colors.text,
                            ...Platform.select({
                              ios: {
                                textAlign: isRTL ? "left" : ""
                              }
                            }),
                          }]}>
                            {(translations[language]?.tabs?.orders?.track?.privateNote || 'Private Note')}
                            {': '}
                            {(note.note_content || note.new_value_display || note.change_description || '')}
                          </Text>
                          {note.updated_by_name ? (
                            <View style={[styles.timelineDetailsContainer]}>
                              <Feather name="user-check" size={14} color="#7C3AED" />
                              <Text style={[styles.timelineDetails, {
                                color: colors.textSecondary, ...Platform.select({
                                  ios: {
                                    textAlign: isRTL ? "left" : ""
                                  }
                                })
                              }]}>
                                {translations[language]?.tabs?.orders?.track?.changedBy || 'Changed By'}: {note.updated_by_name}
                              </Text>
                            </View>
                          ) : null}
                          {(note.updated_at || note.created_at) ? (
                            <View style={[styles.timelineDateContainer]}>
                              <View style={styles.timelineDateItem}>
                                <Feather name="calendar" size={12} color={colors.textTertiary} />
                                <Text style={[styles.timelineDate, { color: colors.textTertiary }]}>
                                  {date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </Text>
                              </View>
                              <View style={styles.timelineDateItem}>
                                <Feather name="clock" size={12} color={colors.textTertiary} />
                                <Text style={[styles.timelineDate, { color: colors.textTertiary }]}>
                                  {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                              </View>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                {privateNotes.length === 0 && (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Feather name="slash" size={40} color={colors.textTertiary} />
                    <Text style={{ color: colors.textTertiary, marginTop: 8 }}>
                      {translations[language]?.common?.noResults || 'No private notes'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {!isPublic && authUser?.role !== 'business' && (
            <ModalPresentation
              showModal={showPrivateNoteModal}
              setShowModal={setShowPrivateNoteModal}
              customStyles={{ bottom: 15 }}
              position="bottom"
            >
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalHeaderText, {
                  color: colors.text, ...Platform.select({
                    ios: {
                      textAlign: isRTL ? "left" : ""
                    }
                  })
                }]}>
                  {translations[language]?.tabs?.orders?.track?.addPrivateNote || 'Add Private Note'}
                </Text>
              </View>
              <View style={styles.modalContent}>
                <Text style={[styles.modalLabel, {
                  color: colors.textSecondary, ...Platform.select({
                    ios: {
                      textAlign: isRTL ? "left" : ""
                    }
                  })
                }]}>
                  {translations[language]?.tabs?.orders?.track?.yourNote || 'Your Note'}
                </Text>
                <TextInput
                  style={[styles.noteInput, {
                    borderColor: colors.border, color: colors.text, backgroundColor: colors.surface, ...Platform.select({
                      ios: {
                        textAlign: isRTL ? "right" : ""
                      }
                    })
                  }]}
                  placeholder={translations[language]?.tabs?.orders?.track?.privateNotePlaceholder || 'Type your private note'}
                  placeholderTextColor={colors.textTertiary}
                  value={privateNoteText}
                  onChangeText={setPrivateNoteText}
                  multiline
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, { borderColor: colors.border }]}
                    onPress={() => setShowPrivateNoteModal(false)}
                    activeOpacity={0.8}
                    disabled={savingPrivateNote}
                  >
                    <Text style={[styles.modalButtonText, { color: colors.text }]}>
                      {translations[language]?.common?.cancel || 'Cancel'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalPrimaryButton, { backgroundColor: colors.primary, opacity: savingPrivateNote ? 0.7 : 1 }]}
                    onPress={handleSavePrivateNote}
                    activeOpacity={0.8}
                    disabled={savingPrivateNote}
                  >
                    {savingPrivateNote ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={[styles.modalPrimaryButtonText, { color: '#fff' }]}>
                        {translations[language]?.common?.save || 'Save'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ModalPresentation>
          )}

          {showStatusUpdateModal && (
            <PickerModal
              list={statusOptions}
              setSelectedValue={handleStatusUpdate}
              showPickerModal={showStatusUpdateModal}
              setShowModal={setShowStatusUpdateModal}
              field={{
                name: 'status',
                label: translations[language].tabs.orders.order.status,
                showSearchBar: false
              }}
            />
          )}

          {showReasonModal && (
            <ModalPresentation
              showModal={showReasonModal}
              setShowModal={setShowReasonModal}
              customStyles={{ bottom: 15 }}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalHeaderText, {
                  color: colors.text, ...Platform.select({
                    ios: {
                      textAlign: isRTL ? "left" : ""
                    }
                  })
                }]}>
                  {translations[language].tabs.orders.order.selectReason || "Select Reason"}
                </Text>
              </View>
              <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
                <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, {
                    color: colors.text, ...Platform.select({
                      ios: {
                        textAlign: isRTL ? "right" : ""
                      }
                    })
                  }]}
                  placeholder={translations[language].common?.search || "Search reasons..."}
                  placeholderTextColor={colors.textSecondary}
                  value={reasonSearchQuery}
                  onChangeText={setReasonSearchQuery}
                />
                {reasonSearchQuery ? (
                  <TouchableOpacity onPress={() => setReasonSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                ) : null}
              </View>
              <ScrollView
                style={styles.reasonScrollContainer}
                contentContainerStyle={styles.reasonContainer}
                showsVerticalScrollIndicator={true}
              >
                {statusOptions
                  .find(option => option.value === selectedValue.status?.value)?.reasons
                  ?.filter(reason =>
                    !reasonSearchQuery ||
                    reason.label.toLowerCase().includes(reasonSearchQuery.toLowerCase())
                  )
                  .map((reason, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.reasonOption}
                      onPress={() => handleReasonSelect(reason)}
                    >
                      <Text style={[styles.reasonText, {
                        color: colors.text, ...Platform.select({
                          ios: {
                            textAlign: isRTL ? "left" : ""
                          }
                        })
                      }]}>
                        {reason.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </ModalPresentation>
          )}

          {showBranchModal && (
            <ModalPresentation
              showModal={showBranchModal}
              setShowModal={setShowBranchModal}
              customStyles={{ bottom: 15 }}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalHeaderText, {
                  color: colors.text, ...Platform.select({
                    ios: {
                      textAlign: isRTL ? "left" : ""
                    }
                  })
                }]}>
                  {translations[language].tabs.orders.order.selectBranch || "Select Branch"}
                </Text>
              </View>
              <View style={styles.branchContainer}>
                {branches.map((branch, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.branchOption}
                    onPress={() => handleBranchSelect(branch)}
                  >
                    <Text style={[styles.branchText, {
                      color: colors.text, ...Platform.select({
                        ios: {
                          textAlign: isRTL ? "left" : ""
                        }
                      })
                    }]}>
                      {branch.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ModalPresentation>
          )}

          {showDriverModal && (
            <PickerModal
              list={drivers}
              setSelectedValue={handleDriverSelect}
              showPickerModal={showDriverModal}
              setShowModal={(val) => {
                setShowDriverModal(val);
                // If closing modal and no driver was picked yet, we still allow proceeding to confirm 
                // for the "change status without driver id" request
                if (!val && !selectedDriver) {
                  setTimeout(() => setShowConfirmStatusChangeUpdateModal(true), 300);
                }
              }}
              field={{
                name: 'driver',
                label: translations[language]?.tabs?.orders?.order?.selectDriver || "Select Driver",
                showSearchBar: true
              }}
              prickerSearchValue={driverSearchQuery}
              setPickerSearchValue={handleDriverSearch}
              loadMoreData={loadMoreDrivers}
              loadingMore={driverLoadingMore}
              allowClear={true}
            />
          )}

          {showConfirmStatusChangeUpdateModal && (
            <ModalPresentation
              showModal={showConfirmStatusChangeUpdateModal}
              setShowModal={setShowConfirmStatusChangeUpdateModal}
              customStyles={{ bottom: 15 }}
            >
              <View style={styles.confirmModalContent}>
                <Text style={[styles.confirmModalTitle, {
                  color: colors.text, ...Platform.select({
                    ios: {
                      textAlign: isRTL ? "left" : ""
                    }
                  })
                }]}>
                  {translations[language].tabs.orders.order.changeStatusAlert}
                  <Text style={[styles.highlightText, { color: colors.text }]}> {statusOptions.find(option => option.value === selectedValue.status?.value)?.label || ''}</Text>
                </Text>

                {selectedBranch && (
                  <View style={styles.selectedDetailContainer}>
                    <Text style={[styles.selectedDetailLabel, {
                      color: colors.text, ...Platform.select({
                        ios: {
                          textAlign: isRTL ? "left" : ""
                        }
                      })
                    }]}>
                      {translations[language].tabs.orders.order.branch || "Branch"}:
                    </Text>
                    <Text style={[styles.selectedDetailValue, {
                      color: colors.text, ...Platform.select({
                        ios: {
                          textAlign: isRTL ? "left" : ""
                        }
                      })
                    }]}>{selectedBranch.label}</Text>
                  </View>
                )}

                {selectedDriver && (
                  <View style={styles.selectedDetailContainer}>
                    <Text style={[styles.selectedDetailLabel, {
                      color: colors.text, ...Platform.select({
                        ios: {
                          textAlign: isRTL ? "left" : ""
                        }
                      })
                    }]}>
                      {translations[language]?.tabs?.orders?.order?.userDriverBoxLabel || "Driver"}:
                    </Text>
                    <Text style={[styles.selectedDetailValue, {
                      color: colors.text, ...Platform.select({
                        ios: {
                          textAlign: isRTL ? "left" : ""
                        }
                      })
                    }]}>{selectedDriver.name} ({selectedDriver.phone})</Text>
                  </View>
                )}

                {selectedReason && (
                  <View style={styles.selectedDetailContainer}>
                    <Text style={[styles.selectedDetailLabel, {
                      color: colors.text, ...Platform.select({
                        ios: {
                          textAlign: isRTL ? "left" : ""
                        }
                      })
                    }]}>
                      {translations[language].tabs.orders.order.reason || "Reason"}:
                    </Text>
                    <Text style={[styles.selectedDetailValue, { color: colors.text }]}>{selectedReason?.value === 'other' ? (UpdatedStatusNote || selectedReason.label) : selectedReason.label}</Text>
                  </View>
                )}

                <TextInput
                  style={[styles.noteInput, {
                    backgroundColor: colors.surface, color: colors.text, ...Platform.select({
                      ios: {
                        textAlign: isRTL ? "right" : ""
                      }
                    })
                  }]}
                  placeholder={selectedReason?.value === 'other'
                    ? (translations[language].tabs.orders.order.reason || "اكتب السبب")
                    : translations[language].tabs.orders.order.changeStatusAlertNote}
                  value={UpdatedStatusNote}
                  onChangeText={(input) => setUpdatedStatusNote(input)}
                  multiline={true}
                  numberOfLines={3}
                  placeholderTextColor={colors.textSecondary}
                />

                <View style={styles.confirmActions}>
                  <TouchableOpacity
                    style={[styles.confirmButton, isUpdatingStatus && styles.confirmButtonDisabled]}
                    onPress={changeStatusHandler}
                    disabled={isUpdatingStatus}
                  >
                    {isUpdatingStatus ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={[styles.confirmButtonText, { color: '#fff' }]}>
                        {translations[language].tabs.orders.order.changeStatusAlertConfirm}
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowConfirmStatusChangeUpdateModal(false);
                      setSelectedReason(null);
                      setSelectedBranch(null);
                      setSelectedDriver(null);
                      setUpdatedStatusNote("");
                    }}
                  >
                    <Text style={[styles.cancelButtonText, {
                      color: colors.text, ...Platform.select({
                        ios: {
                          textAlign: isRTL ? "left" : ""
                        }
                      })
                    }]}>
                      {translations[language].tabs.orders.order.changeStatusAlertCancel}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ModalPresentation>
          )}

          {showActionsModal && (
            <ModalPresentation
              showModal={showActionsModal}
              setShowModal={setShowActionsModal}
              customStyles={{ bottom: 15 }}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalHeaderText, {
                  color: colors.text, ...Platform.select({
                    ios: {
                      textAlign: isRTL ? "left" : ""
                    }
                  })
                }]}>
                  {translations[language]?.tabs?.orders?.order?.orderActions || 'Order actions'}
                </Text>
              </View>
              <View style={styles.controlContainer}>

                {(
                  (!isPublic && authUser?.role === "business" && order.status_key === "waiting") ||
                  (!isPublic && !["driver", "delivery_company", "business"].includes(authUser?.role) &&
                    ["waiting", "in_branch", "rejected", "stuck", "delayed", "on_the_way",
                      "reschedule", "dispatched_to_branch", "dispatched_to_driver", "delivered",
                      "return_before_delivered_initiated", "return_after_delivered_initiated",
                      "business_returned_delivered", "received", "delivered/received"].includes(order.status_key))
                ) && (
                    <TouchableOpacity
                      style={styles.controlOption}
                      onPress={() => {
                        setShowActionsModal(false);
                        handleEditOrder();
                      }}
                    >
                      <View style={[styles.controlIconContainer, { backgroundColor: '#4361EE' }]}>
                        <Feather name="edit" size={18} color="#ffffff" />
                      </View>
                      <Text style={[styles.controlText, {
                        color: colors.text, ...Platform.select({
                          ios: {
                            textAlign: isRTL ? "left" : ""
                          }
                        })
                      }]}>
                        {translations[language]?.tabs?.orders?.order?.edit || 'Edit Order'}
                      </Text>
                    </TouchableOpacity>
                  )}

                {(
                  (!isPublic && ["driver", "delivery_company"].includes(authUser?.role) &&
                    ["on_the_way", "reschedule", "rejected", "stuck", "delayed", "driver_responsibility"].includes(order.status_key)) ||
                  (!isPublic && authUser?.role === "business" &&
                    ["in_branch", "stuck", "delayed", "on_the_way", "reschedule",
                      "dispatched_to_branch", "dispatched_to_driver"].includes(order.status_key))
                ) && (
                    <TouchableOpacity
                      style={styles.controlOption}
                      onPress={() => {
                        setShowActionsModal(false);
                        router.push({
                          pathname: "(edit_receiver_phones)",
                          params: { orderId: order.order_id, editPhoneOnly: true }
                        });
                      }}
                    >
                      <View style={[styles.controlIconContainer, { backgroundColor: '#10B981' }]}>
                        <Feather name="edit" size={18} color="#ffffff" />
                      </View>
                      <Text style={[styles.controlText, {
                        color: colors.text, ...Platform.select({
                          ios: {
                            textAlign: isRTL ? "left" : ""
                          }
                        })
                      }]}>
                        {translations[language]?.tabs?.orders?.order?.editPhone || 'Edit Receiver Phone'}
                      </Text>
                    </TouchableOpacity>
                  )}

                <TouchableOpacity
                  style={styles.controlOption}
                  onPress={() => {
                    setShowActionsModal(false);
                    handleCallReceiver();
                  }}
                >
                  <View style={[styles.controlIconContainer, { backgroundColor: '#16A34A' }]}>
                    <Feather name="phone-call" size={18} color="#ffffff" />
                  </View>
                  <Text style={[styles.controlText, {
                    color: colors.text, ...Platform.select({
                      ios: {
                        textAlign: isRTL ? "left" : ""
                      }
                    })
                  }]}>
                    {translations[language]?.tabs?.orders?.order?.userBoxPhoneContactLabel || 'Call'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlOption}
                  onPress={() => {
                    setShowActionsModal(false);
                    setTimeout(() => setShowWhatsappOptions(true), 200);
                  }}
                >
                  <View style={[styles.controlIconContainer, { backgroundColor: '#22C55E' }]}>
                    <Feather name="message-circle" size={18} color="#ffffff" />
                  </View>
                  <Text style={[styles.controlText, {
                    color: colors.text, ...Platform.select({
                      ios: {
                        textAlign: isRTL ? "left" : ""
                      }
                    })
                  }]}>
                    {translations[language]?.tabs?.orders?.track?.contactWhatsapp || 'WhatsApp'}
                  </Text>
                </TouchableOpacity>

                {canChangeStatus && (
                  <TouchableOpacity
                    style={styles.controlOption}
                    onPress={() => {
                      setShowActionsModal(false);
                      openStatusUpdateFlow();
                    }}
                  >
                    <View style={[styles.controlIconContainer, { backgroundColor: '#7209B7' }]}>
                      <MaterialIcons name="published-with-changes" size={18} color="#ffffff" />
                    </View>
                    <Text style={[styles.controlText, {
                      color: colors.text, ...Platform.select({
                        ios: {
                          textAlign: isRTL ? "left" : ""
                        }
                      })
                    }]}>
                      {translations[language]?.tabs?.orders?.order?.changeStatus || 'Change status'}
                    </Text>
                  </TouchableOpacity>
                )}

                {authUserRole === "business" && (
                  <TouchableOpacity
                    style={styles.controlOption}
                    onPress={() => {
                      setShowActionsModal(false);
                      handleOpenComplaint();
                    }}
                  >
                    <View style={[styles.controlIconContainer, { backgroundColor: '#EF4444' }]}>
                      <Feather name="alert-circle" size={18} color="#ffffff" />
                    </View>
                    <Text style={[styles.controlText, {
                      color: colors.text, ...Platform.select({
                        ios: {
                          textAlign: isRTL ? "left" : ""
                        }
                      })
                    }]}>
                      {translations[language]?.tabs?.orders?.track?.openCase || 'Open Complaint'}
                    </Text>
                  </TouchableOpacity>
                )}

                {authUser?.role === "business" && String(order?.status_key || '').toLowerCase() === 'waiting' && (
                  <TouchableOpacity
                    style={styles.controlOption}
                    onPress={() => {
                      setShowActionsModal(false);
                      handleCancelOrder();
                    }}
                  >
                    <View style={[styles.controlIconContainer, { backgroundColor: '#EF4444' }]}>
                      <Feather name="x-circle" size={18} color="#ffffff" />
                    </View>
                    <Text style={[styles.controlText, {
                      color: colors.text, ...Platform.select({
                        ios: {
                          textAlign: isRTL ? "left" : ""
                        }
                      })
                    }]}>
                      {translations[language]?.tabs?.orders?.order?.cancelOrder || 'Cancel Order'}
                    </Text>
                  </TouchableOpacity>
                )}

                {authUserRole === "business" && (
                  <TouchableOpacity
                    style={[styles.controlOption, styles.noBorder]}
                    onPress={() => {
                      setShowActionsModal(false);
                      handlePrintOrder();
                    }}
                    disabled={isPdfLoading}
                  >
                    <View style={[styles.controlIconContainer, { backgroundColor: isPdfLoading ? '#94A3B8' : '#059669' }]}>
                      {isPdfLoading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Feather name="printer" size={18} color="#ffffff" />
                      )}
                    </View>
                    <Text style={[styles.controlText, {
                      color: colors.text, ...Platform.select({
                        ios: {
                          textAlign: isRTL ? "left" : ""
                        }
                      })
                    }]}>
                      {isPdfLoading
                        ? (translations[language]?.common?.generating || "Generating...")
                        : (translations[language]?.tabs?.orders?.order?.printOrder || "Print Order")}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </ModalPresentation>
          )}

          {showWhatsappOptions && (
            <ModalPresentation
              showModal={showWhatsappOptions}
              setShowModal={setShowWhatsappOptions}
              customStyles={{ bottom: 15 }}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalHeaderText, {
                  color: colors.text, ...Platform.select({
                    ios: {
                      textAlign: isRTL ? "left" : ""
                    }
                  })
                }]}>
                  {translations[language]?.tabs?.orders?.order?.whatsapp || 'WhatsApp'}
                </Text>
              </View>
              <View style={styles.controlContainer}>
                <TouchableOpacity
                  style={styles.controlOption}
                  onPress={() => {
                    setShowWhatsappOptions(false);
                    openWhatsapp('972');
                  }}
                >
                  <View style={[styles.controlIconContainer, { backgroundColor: '#22C55E' }]}>
                    <FontAwesome name="whatsapp" size={18} color="#ffffff" />
                  </View>
                  <Text style={[styles.controlText, {
                    color: colors.text, ...Platform.select({
                      ios: {
                        textAlign: isRTL ? "left" : ""
                      }
                    })
                  }]}>
                    {getWhatsappLocal() ? `+972${getWhatsappLocal()}` : '+972'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.controlOption, styles.noBorder]}
                  onPress={() => {
                    setShowWhatsappOptions(false);
                    openWhatsapp('970');
                  }}
                >
                  <View style={[styles.controlIconContainer, { backgroundColor: '#22C55E' }]}>
                    <FontAwesome name="whatsapp" size={18} color="#ffffff" />
                  </View>
                  <Text style={[styles.controlText, {
                    color: colors.text, ...Platform.select({
                      ios: {
                        textAlign: isRTL ? "left" : ""
                      }
                    })
                  }]}>
                    {getWhatsappLocal() ? `+970${getWhatsappLocal()}` : '+970'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ModalPresentation>
          )}

          {showPrintOptionsModal && (
            <ModalPresentation
              showModal={showPrintOptionsModal}
              setShowModal={setShowPrintOptionsModal}
              customStyles={{ bottom: 15 }}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalHeaderText, {
                  color: colors.text, ...Platform.select({
                    ios: {
                      textAlign: isRTL ? "left" : ""
                    }
                  })
                }]}>
                  {translations[language]?.tabs?.orders?.order?.selectPrintFormat || "Select Print Format"}
                </Text>
              </View>
              <ScrollView
                style={styles.reasonScrollContainer}
                contentContainerStyle={styles.reasonContainer}
                showsVerticalScrollIndicator={true}
              >
                {printFormats.map((format) => (
                  <TouchableOpacity
                    key={format.id}
                    style={[
                      styles.reasonOption,
                      selectedPrintFormat?.id === format.id && styles.selectedReasonOption,
                      { backgroundColor: selectedPrintFormat?.id === format.id ? colors.primary + '20' : colors.surface }
                    ]}
                    onPress={() => handlePrintFormatSelect(format)}
                  >
                    <View style={styles.reasonOptionContent}>
                      <Text style={[
                        styles.reasonOptionText,
                        {
                          color: selectedPrintFormat?.id === format.id ? colors.primary : colors.text,
                          fontWeight: selectedPrintFormat?.id === format.id ? '600' : '400'
                        }
                      ]}>
                        {format.name}
                      </Text>
                      <Text style={[
                        styles.reasonOptionDescription,
                        { color: colors.textSecondary }
                      ]}>
                        {format.description}
                      </Text>
                    </View>
                    {selectedPrintFormat?.id === format.id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </ModalPresentation>
          )}

          {/* Support Section */}
          {!isPublic && authUser?.role === "business" && (
            <View style={[styles.modernCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.cardHeader]}
              >
                <View style={[styles.cardIconContainer]}>
                  <Ionicons name="help-buoy" size={20} color="#ffffff" />
                </View>
                <Text style={[styles.cardHeaderText]}>
                  {translations[language]?.tabs.orders.track.needHelp || 'Need Help?'}
                </Text>
              </LinearGradient>

              <View style={styles.supportContent}>
                <View style={styles.supportTextContainer}>
                  <Feather name="alert-circle" size={24} color="#EF4444" style={styles.supportTextIcon} />
                  <Text style={[styles.supportText, {
                    color: colors.textSecondary,
                    ...Platform.select({
                      ios: {
                        textAlign: isRTL ? "left" : ""
                      }
                    }),
                  }]}>
                    {translations[language].tabs.orders.track.issue}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.supportButton}
                  onPress={() => router.push({
                    pathname: "/(complaints)/open_complaint",
                    params: { orderId: orderId }
                  })}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#EF4444', '#DC2626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.supportButtonGradient}
                  >
                    <Feather name="message-circle" size={18} color="#ffffff" style={{ marginRight: 10 }} />
                    <Text style={[styles.supportButtonText, {
                      ...Platform.select({
                        ios: {
                          textAlign: isRTL ? "left" : ""
                        }
                      }),
                    }]}>
                      {translations[language].tabs.orders.track.openCase}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  cardsContainer: {
    padding: 16,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  blurContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 24,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#4361EE',
  },

  // Hero Header Styles
  heroContainer: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  orderBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 30,
  },
  orderIdLabel: {
    color: 'white',
    fontWeight: '700',
    fontSize: 18,
  },
  currentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
    marginTop: 12,
    gap: 8
  },
  currentStatusText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#ffffff',
  },
  contactTrailsHeader: {
    marginTop: 14,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)'
  },
  contactTrailsHeaderTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8
  },
  contactTrailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    gap: 8
  },
  contactTrailsText: {
    color: '#E0E7FF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1
  },
  heroInfoContainer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  heroInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    gap: 10
  },
  heroInfoText: {
    color: '#E0E7FF',
    fontSize: 14,
  },

  // Modern Card Styles
  modernCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 10
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  privateNoteAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  privateNoteAddButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    padding: 20,
  },

  // Info Row Styles
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)'
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 7
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748B',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1.5,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'space-between',
    flex: 1.5,
  },
  phoneButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  infoValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.5,
    gap: 8,
  },
  copyButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },

  // Details Grid Styles
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  detailsGridItem: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  detailsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailsLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 6,
  },
  detailsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },

  // Driver Section
  driverContainer: {
    backgroundColor: 'rgba(249, 115, 22, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10
  },
  driverIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  driverHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F97316',
  },
  driverContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10
  },
  driverName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1
  },

  // Financial Summary
  financialSummary: {
    marginBottom: 20,
  },
  financialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    gap: 7
  },
  highlightedFinancialItem: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 10,
    borderBottomWidth: 0,
  },
  financialIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  financialLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    flex: 1,
  },
  financialValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  financialLabelHighlight: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    flex: 1,
  },
  financialValueHighlight: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10B981',
  },

  // Checks Section
  checksContainer: {
    marginTop: 10,
  },
  checksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    marginBottom: 14,
  },
  checksHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  checkItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  checkHeader: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  checkNumberLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  checkDetails: {
    paddingLeft: 6,
  },
  checkDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10
  },
  checkDetailLabel: {
    fontSize: 14,
    color: '#64748B',
    marginRight: 8,
  },
  checkDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },

  // Note Styles
  noteContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 15
  },
  noteIcon: {
    marginTop: 2,
  },
  noteText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1F2937',
    flex: 1,
  },

  // Package Styles
  packageWrapper: {
    flexDirection: 'row',
    gap: 10
  },
  packageImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: 'rgba(67, 97, 238, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  packageInfo: {
    flex: 1,
  },
  packageInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  packageLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 7
  },
  packageInfoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  packageInfoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  packageItemsBlock: {
    marginBottom: 16,
  },
  packageItemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  packageItemsTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  packageItemsBadge: {
    backgroundColor: '#E0E7FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  packageItemsBadgeText: {
    color: '#4338CA',
    fontSize: 12,
    fontWeight: '700',
  },
  packageItemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  packageItemCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    minWidth: 120,
    flexGrow: 1,
  },
  packageItemCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  packageItemNumber: {
    fontSize: 12,
    fontWeight: '700',
  },
  packageItemQr: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Timeline Styles
  timelineContainer: {
    position: 'relative',
    padding: 20,
  },
  timelineLine: {
    position: 'absolute',
    left: 30,
    top: 40,
    bottom: 40,
    width: 2,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 30,
    position: 'relative',
    gap: 10
  },
  lastTimelineItem: {
    marginBottom: 0,
  },
  timelineIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
  },
  timelineStatus: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1F2937',
  },
  timelineDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10
  },
  timelineDetails: {
    fontSize: 14,
    color: '#64748B',
  },
  timelineDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10
  },
  timelineDateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  timelineDate: {
    fontSize: 12,
    color: '#94A3B8',
  },

  // Support Section
  supportContent: {
    padding: 20,
    alignItems: 'center',
  },
  supportTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12
  },
  supportText: {
    fontSize: 15,
    color: '#64748B',
    flex: 1,
    lineHeight: 22,
  },
  supportButton: {
    width: '100%',
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  supportButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  modalHeader: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1
  },
  modalHeaderText: {
    fontSize: 16,
    fontWeight: '700'
  },
  modalContent: {
    padding: 16,
    gap: 12
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600'
  },
  noteInput: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top'
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600'
  },
  modalPrimaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalPrimaryButtonText: {
    fontSize: 14,
    fontWeight: '700'
  },
  controlContainer: {
    width: '100%',
  },
  controlOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    width: '100%',
    gap: 15
  },
  controlIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 14
  },
  reasonScrollContainer: {
    maxHeight: 260
  },
  reasonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  reasonOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)'
  },
  reasonText: {
    fontSize: 14,
    fontWeight: '600'
  },
  reasonOptionContent: {
    flex: 1,
    gap: 4
  },
  reasonOptionText: {
    fontSize: 14
  },
  reasonOptionDescription: {
    fontSize: 12
  },
  selectedReasonOption: {
    borderColor: 'rgba(67, 97, 238, 0.3)'
  },
  branchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
    marginTop: 12
  },
  branchOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)'
  },
  branchText: {
    fontSize: 14,
    fontWeight: '600'
  },
  confirmModalContent: {
    padding: 16,
    gap: 12
  },
  confirmModalTitle: {
    fontSize: 16,
    fontWeight: '700'
  },
  highlightText: {
    fontWeight: '700'
  },
  selectedDetailContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  selectedDetailLabel: {
    fontSize: 13,
    fontWeight: '600'
  },
  selectedDetailValue: {
    fontSize: 13,
    fontWeight: '600'
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#4361EE',
    alignItems: 'center',
    justifyContent: 'center'
  },
  confirmButtonDisabled: {
    opacity: 0.6
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700'
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700'
  },

  // Error Styles
  errorContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  errorButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  errorButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  errorButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },

  // Currency display
  currencyContainer: {
    flexDirection: 'column',
  },
  currencyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  costText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },

  // Edit Button Styles
  editButton: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#4361EE',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  editButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  actionsButton: {
    marginTop: 10,
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  actionsButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionsButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },

  // Edit Phone Button Styles
  editPhoneButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  editPhoneButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPhoneButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default TrackingOrder;
