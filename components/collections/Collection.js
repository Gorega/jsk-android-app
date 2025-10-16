import { View, StyleSheet, Text, TouchableOpacity, Platform, Linking, Alert, ActivityIndicator, Share } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from "../../RootLayout";
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import UserBox from "../orders/userBox/UserBox";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import ModalPresentation from "../ModalPresentation";
import { useState } from 'react';
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';
import React from 'react';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import tayarLogo from '../../assets/images/tayar_logo_dark.png';

function Collection({ type, collection }) {
    const { language } = useLanguage();
    const { user } = useAuth();
    const { isDark, colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const [showModal, setShowModal] = useState(false);
    const [showPhoneOptions, setShowPhoneOptions] = useState(false);
    const [currentPhone, setCurrentPhone] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const isRTL = language === 'ar' || language === 'he';

    // Handle phone call
    const handlePhoneCall = (phoneNumber) => {
        if (!phoneNumber) return;
        Linking.openURL(`tel:${phoneNumber}`);
    };

    // Handle WhatsApp with 972 prefix
    const handleWhatsApp972 = (phoneNumber) => {
        if (!phoneNumber) return;
        const whatsappNumber = phoneNumber.startsWith('0') ? 
            phoneNumber.substring(1) : phoneNumber;
        Linking.openURL(`whatsapp://send?phone=972${whatsappNumber}`);
    };

    // Handle WhatsApp with 970 prefix
    const handleWhatsApp970 = (phoneNumber) => {
        if (!phoneNumber) return;
        const whatsappNumber = phoneNumber.startsWith('0') ? 
            phoneNumber.substring(1) : phoneNumber;
        Linking.openURL(`whatsapp://send?phone=970${whatsappNumber}`);
    };

    // const handleCollectNotification = async (type, action) => {
    //     setIsLoading(true);
    //     try {
    //         // const token = await getToken("userToken");
    //         const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/collections/collect/request?requestType=${type}`, {
    //             method: "POST",
    //             headers: {
    //                 'Accept': 'application/json',
    //                 'Content-Type': 'application/json',
    //                 'Accept-Language': language,
    //                 // "Cookie": token ? `token=${token}` : ""
    //             },
    //             credentials: "include",
    //             body: JSON.stringify({
    //                 action,
    //                 collection_id: collection.collection_id
    //             })
    //         });
    //         const data = await res.json();
    //         Alert.alert(data.message);
    //     } catch (err) {
    //         Alert.alert(err.message);
    //     } finally {
    //         setIsLoading(false);
    //         setShowModal(false);
    //     }
    // };

    const renderCollectionUser = () => {
        if ((type === "business_money" || type === "business_returned") && user.role !== "business") {
            return <UserBox
                box={{
                    label: translations[language].tabs.orders.order.userSenderBoxLabel,
                    userName: collection.from_user_name,
                    phone: collection.from_user_phone
                }}
            />
        }
        if ((type === "sent" || type === "dispatched" || type === "driver_money" || type === "driver_returned") && !["driver","delivery_company"].includes(user.role)) {
            return <UserBox
                box={{
                    label: translations[language].tabs.orders.order.userDriverBoxLabel,
                    userName: type === "sent" ? collection.driver_name : collection.driver_name,
                    phone: collection.driver_phone
                }}
            />
        }
    }

    // Get status color
    const getStatusColor = (statusKey) => {
        const statusColors = {
            "returned_in_branch": colors.primary,
            "money_in_branch": colors.primary,
            "deleted": colors.error,
            "returned_out": colors.info,
            "money_out": colors.info,
            "returned_delivered": colors.info,
            "paid": colors.info,
            "completed": colors.success,
            "pending": "#8B5CF6",
            "in_dispatched_to_branch": "#8B5CF6",
            "partial": "#8B5CF6"
        };
        
        return statusColors[statusKey] || colors.textSecondary;
    };

    // Format financials helper
    const formatFinancials = (fieldKey) => {
        try {
            if (collection?.financials && Array.isArray(collection.financials) && collection.financials.length > 0) {
                return collection.financials
                    .map((f, index) => `${f.currency_code}: ${f[fieldKey] || '0.00'}${index < collection.financials.length - 1 ? ' | ' : ''}`)
                    .join('');
            }
        } catch (_) { /* noop */ }
        return '-';
    };

    // Helper function to generate HTML template for PDF
    const generateCollectionHTML = (collection, ordersData, type, language) => {
        const isRTL = language === 'ar' || language === 'he';
        const direction = isRTL ? 'rtl' : 'ltr';
        const textAlign = isRTL ? 'right' : 'left';
        
        // Ensure ordersData is an array
        const safeOrdersData = Array.isArray(ordersData) ? ordersData : [];
        
        // Calculate totals
        const totalValue = type === "sent" 
            ? collection.total_net_value 
            : type === "business_money" 
                ? formatFinancials('final_amount') 
                : formatFinancials('total_cod_value');

        return `
        <!DOCTYPE html>
        <html dir="${direction}">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Collection #${collection.collection_id}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700&family=Roboto:wght@400;500;700&display=swap');
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: ${isRTL ? "'Noto Sans Arabic', Arial, sans-serif" : "'Roboto', Arial, sans-serif"};
                    direction: ${direction};
                    text-align: ${textAlign};
                    line-height: 1.6;
                    color: #333;
                    padding: 20px;
                    background: white;
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 3px solid #4361EE;
                    padding-bottom: 20px;
                }
                
                .header h1 {
                    color: #4361EE;
                    font-size: 28px;
                    font-weight: 700;
                    margin-bottom: 10px;
                }
                
                .header .meta {
                    color: #64748B;
                    font-size: 14px;
                }
                
                .section {
                    margin-bottom: 25px;
                    background: #f8fafc;
                    padding: 15px;
                    border-radius: 8px;
                    border-left: 4px solid #4361EE;
                }
                
                .section-title {
                    color: #4361EE;
                    font-size: 16px;
                    font-weight: 600;
                    margin-bottom: 15px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 15px;
                }
                
                .info-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid #e2e8f0;
                }
                
                .info-label {
                    font-weight: 500;
                    color: #64748B;
                    min-width: 120px;
                }
                
                .info-value {
                    font-weight: 600;
                    color: #1f2937;
                    text-align: ${isRTL ? 'left' : 'right'};
                }
                
                .status-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 20px;
                    background: #4361EE;
                    color: white;
                    font-size: 12px;
                    font-weight: 600;
                }
                
                .orders-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                
                .orders-table th {
                    background: #4361EE;
                    color: white;
                    padding: 8px 4px;
                    font-weight: 600;
                    text-align: ${textAlign};
                    font-size: 11px;
                    word-wrap: break-word;
                    max-width: 100px;
                }
                
                .orders-table td {
                    padding: 6px 4px;
                    border-bottom: 1px solid #e2e8f0;
                    text-align: ${textAlign};
                    font-size: 10px;
                    word-wrap: break-word;
                    max-width: 100px;
                }
                
                .orders-table tr:nth-child(even) {
                    background: #f8fafc;
                }
                
                .orders-table tr:hover {
                    background: #e2e8f0;
                }
                
                .total-row {
                    background: #4361EE !important;
                    color: white;
                    font-weight: 700;
                }
                
                .footer {
                    margin-top: 40px;
                    text-align: center;
                    color: #64748B;
                    font-size: 12px;
                    border-top: 1px solid #e2e8f0;
                    padding-top: 20px;
                }
                
                @media print {
                    body { padding: 0; }
                    .section { break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    <div style="flex: 1;">
                       <h1 style="margin: 0; color: #4361EE; font-size:15px">JSK للخدمات اللوجستية والبريد السريع</h1>
                        <h1 style="margin: 0; color: #4361EE;">كشف #${collection.collection_id}</h1>
                    </div>
                    <div class="meta" style="text-align: right;">
                        <br><br>
                        تاريخ الإنشاء: ${new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : language === 'he' ? 'he-IL' : 'en-US')}
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">تفاصيل المجموعة</div>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">عدد الطلبات:</span>
                        <span class="info-value">${type === "sent" ? collection.collections_count : collection.order_count}</span>
                    </div>
                    ${type !== "returned" ? `
                    <div class="info-item">
                        <span class="info-label">${type === "sent" 
                            ? "المبلغ المطلوب توصيله" 
                            : type === "business_money" 
                                ? "المبلغ المطلوب تحصيله" 
                                : "المبلغ المطلوب تحصيله"}:</span>
                        <span class="info-value">${totalValue}</span>
                    </div>
                    ` : ''}
                    ${type === "driver_money" ? `
                    <div class="info-item">
                        <span class="info-label">إجمالي الخصومات:</span>
                        <span class="info-value">${formatFinancials('total_deductions')}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">المبلغ النهائي:</span>
                        <span class="info-value">${formatFinancials('final_amount')}</span>
                    </div>
                    ` : ''}
                </div>
            </div>

            ${collection.sub_orders && collection.sub_orders.length > 0 ? `
            <div class="section">
                <div class="section-title">تفاصيل التاجر</div>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">اسم التاجر:</span>
                        <span class="info-value">${collection.sub_orders[0].business_name}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">هاتف التاجر:</span>
                        <span class="info-value">${collection.sub_orders[0].business_phone}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">موقع التاجر:</span>
                        <span class="info-value">${collection.sub_orders[0].business_city} | ${collection.sub_orders[0].business_address}</span>
                    </div>
                </div>
            </div>
            ` : ''}

            ${(type === "returned" || type === "dispatched") ? `
            <div class="section">
                <div class="section-title">تفاصيل الفرع</div>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">الفرع الحالي:</span>
                        <span class="info-value">${collection.current_branch_name}</span>
                    </div>
                    ${type === "dispatched" ? `
                    <div class="info-item">
                        <span class="info-label">إلى الفرع:</span>
                        <span class="info-value">${collection.to_branch_name}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            ` : ''}

            ${safeOrdersData.length > 0 ? `
            <div class="section">
                <div class="section-title">قائمة الطلبات</div>
                <table class="orders-table">
                    <thead>
                        <tr>
                            <th>الباركود</th>
                            <th>رقم الطلب</th>
                            <th>اسم المستلم</th>
                            <th>هاتف المستلم</th>
                            <th>عنوان المستلم</th>
                            <th>ملاحظة</th>
                            <th>قيمة الدفع عند الاستلام</th>
                            <th>القيمة الصافية</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${safeOrdersData.map(order => `
                        <tr>
                            <td style="text-align: center; padding: 8px;">
                                ${order.barcode ? `<img src="data:image/png;base64,${order.barcode}" alt="Barcode" style="max-width: 80px; height: auto;" />` : 'N/A'}
                            </td>
                            <td>${order.order_id || 'N/A'}</td>
                            <td>${order.receiver_name || 'N/A'}</td>
                            <td>${order.receiver_mobile || order.receiver_phone || 'N/A'}</td>
                            <td>${order.receiver_address || 'N/A'}</td>
                            <td>${order.note || 'لا توجد ملاحظات'}</td>
                            <td>${order.total_cod_value || 'N/A'}</td>
                            <td>${order.total_net_value || 'N/A'}</td>
                        </tr>
                        `).join('')}
                        <tr class="total-row">
                            <td colspan="7"><strong>الإجمالي:</strong></td>
                            <td><strong>${totalValue}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            ` : ''}

            <div class="footer">
                <p>تم الإنشاء في: ${new Date().toLocaleString(language === 'ar' ? 'ar-EG' : language === 'he' ? 'he-IL' : 'en-US')}</p>
                <p>خدمة توصيل JSK</p>
            </div>
        </body>
        </html>
        `;
    };
 
    // Generate PDF using expo-print
    const generatePDF = async () => {
        try {
            setIsPdfLoading(true);
            
            // Fetch collection details with orders if needed
            let ordersData = [];
            
            if (collection.order_ids) {
                try {
                    const apiUrl = `${process.env.EXPO_PUBLIC_API_URL}/api/orders?order_ids=${collection.order_ids}`;
                    
                    // Fetch real order details from API with proper authentication
                    const response = await fetch(apiUrl, {
                        method: "GET",
                        credentials: "include",
                        headers: {
                            'Accept': 'application/json',
                            "Content-Type": "application/json",
                        }
                    });
                    const result = await response.json();
                    
                    if (response.ok && result.data && Array.isArray(result.data)) {
                        ordersData = result.data;
                    } else {
                        ordersData = [];
                    }
                } catch (error) {
                    console.error('PDF Generation: Fetch error:', error);
                    ordersData = [];
                }
            } else {
                console.log('PDF Generation: No order_ids found in collection');
            }
            
            // Generate HTML content
                const htmlContent = generateCollectionHTML(collection, ordersData, type, language);
            
            // Generate PDF from HTML
            const { uri } = await Print.printToFileAsync({
                html: htmlContent,
                base64: false,
                width: 612,
                height: 792,
                margins: {
                    left: 20,
                    top: 20,
                    right: 20,
                    bottom: 20,
                },
                fileName: `Tayar_Collection_${collection.collection_id}_${new Date().toISOString().split('T')[0]}.pdf`
            });
            
            // Share the PDF file
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: `Collection #${collection.collection_id} PDF`,
                    UTI: 'com.adobe.pdf'
                });
            } else {
                Alert.alert(
                    translations[language]?.collections?.collection?.sharingNotAvailable || "Sharing Not Available",
                    translations[language]?.collections?.collection?.sharingNotAvailableMessage || "Sharing is not available on this device"
                );
            }
        } catch (error) {
            console.error("Error generating PDF:", error);
            Alert.alert(
                translations[language]?.collections?.collection?.pdfError || "PDF Generation Error",
                translations[language]?.collections?.collection?.pdfErrorMessage || "There was an error generating the PDF"
            );
        } finally {
            setIsPdfLoading(false);
        }
    };
    
  
    return (
        <View style={[
            styles.collectionCard,
            { 
                backgroundColor: colors.card,
                shadowColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)'
            }
        ]}>
            {/* Header section with ID and status */}
            <View style={[
                styles.header,
                { 
                    borderBottomColor: colors.border,
                    backgroundColor: isDark ? colors.surface : 'rgba(67, 97, 238, 0.05)'
                }
            ]}>
                <View style={styles.idSection}>
                    <View style={[styles.idContainer]}>
                        <Text style={[
                            styles.idText,
                            { color: colors.primary }
                        ]}>#{collection.collection_id}</Text>
                    </View>
                </View>
                
            </View>
            
            <View style={styles.contentContainer}>
                {/* User information */}
                <View style={styles.userInfoSection}>
                    {renderCollectionUser()}
                </View>
                
                {/* Order count section */}
                <View style={[
                    styles.infoSection,
                    { backgroundColor: colors.surface }
                ]}>
                    <View style={[styles.sectionRow]}>
                        <View style={[
                            styles.iconWrapper, 
                            { backgroundColor: colors.primary }
                        ]}>
                            <Feather name="package" size={20} color="#ffffff" />
                        </View>
                        <View style={[
                            styles.sectionContent,
                            {
                                ...Platform.select({
                                    ios: {
                                        alignItems: isRTL ? "flex-start" : ""
                                    }
                                }),
                            }
                        ]}>
                            <Text style={[
                                styles.sectionTitle,
                                { color: colors.textSecondary, textAlign: isRTL ? "left" : "" }
                            ]}>
                                {type === "sent" 
                                    ? translations[language].collections.collection.numberOfCollections 
                                    : translations[language].collections.collection.numberOfOrders}
                            </Text>
                            <Text style={[
                                styles.sectionValue,
                                { color: colors.text }
                            ]}>
                                {type === "sent" ? collection.collections_count : collection.order_count}
                            </Text>
                        </View>
                    </View>
                </View>
                
                
                {/* Money section */}
                {type !== "returned" && (
                    <View style={[
                        styles.infoSection,
                        { backgroundColor: colors.surface }
                    ]}>
                        <View style={[styles.sectionRow]}>
                            <View style={[
                                styles.iconWrapper, 
                                { backgroundColor: '#F72585' }
                            ]}>
                                <MaterialIcons name="attach-money" size={20} color="#ffffff" />
                            </View>
                            <View style={[
                                styles.sectionContent,
                                {
                                    ...Platform.select({
                                        ios: {
                                            alignItems: isRTL ? "flex-start" : ""
                                        }
                                    }),
                                }
                            ]}>
                                <Text style={[
                                    styles.sectionTitle,
                                    { color: colors.textSecondary }
                                ]}>
                                    {type === "sent" 
                                        ? translations[language].collections.collection.moneyToDeliver 
                                        : translations[language].collections.collection.moneyToCollect}
                                </Text>
                                <Text style={[
                                    styles.sectionValue,
                                    { color: colors.text, textAlign: isRTL ? "left" : "" }
                                ]}>
                                    {type === "sent" ? collection.total_net_value : type === "business_money" ? formatFinancials('final_amount') : formatFinancials('total_cod_value')}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Driver money extra financials */}
                {(type === "driver_money") && (
                    <>
                        <View style={[styles.infoSection, { backgroundColor: colors.surface }]}>
                            <View style={[styles.sectionRow]}>
                                <View style={[styles.iconWrapper, { backgroundColor: '#F59E0B' }]}>
                                    <MaterialIcons name="remove-circle-outline" size={20} color="#ffffff" />
                                </View>
                                <View style={[styles.sectionContent, {
                                    ...Platform.select({
                                        ios: { alignItems: isRTL ? "flex-start" : "" }
                                    }),
                                }]}>
                                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                                        {translations[language]?.collections?.collection?.totalDeductions}
                                    </Text>
                                    <Text style={[styles.sectionValue, { color: colors.text, textAlign: isRTL ? "left" : "" }]}>
                                        {formatFinancials('total_deductions')}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View style={[styles.infoSection, { backgroundColor: colors.surface }]}>
                            <View style={[styles.sectionRow]}>
                                <View style={[styles.iconWrapper, { backgroundColor: '#10B981' }]}>
                                    <MaterialIcons name="payments" size={20} color="#ffffff" />
                                </View>
                                <View style={[styles.sectionContent, {
                                    ...Platform.select({
                                        ios: { alignItems: isRTL ? "flex-start" : "" }
                                    }),
                                }]}>
                                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                                        {translations[language]?.collections?.collection?.finalAmount}
                                    </Text>
                                    <Text style={[styles.sectionValue, { color: colors.text, textAlign: isRTL ? "left" : "" }]}>
                                        {formatFinancials('final_amount')}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </>
                )}
                
                {/* Checks section for driver */}
                {(type === "sent" && collection.total_checks > 0) && (
                    <View style={[
                        styles.infoSection,
                        { backgroundColor: colors.surface }
                    ]}>
                        <View style={[styles.sectionRow]}>
                            <View style={[
                                styles.iconWrapper, 
                                { backgroundColor: '#3A0CA3' }
                            ]}>
                                <MaterialIcons name="attach-money" size={20} color="#ffffff" />
                            </View>
                            <View style={[
                                styles.sectionContent,
                                {
                                    ...Platform.select({
                                        ios: {
                                            alignItems: isRTL ? "flex-start" : ""
                                        }
                                    }),
                                }
                            ]}>
                                <Text style={[
                                    styles.sectionTitle,
                                    { color: colors.textSecondary }
                                ]}>
                                    {translations[language].collections.collection.checksToDeliver}
                                </Text>
                                <Text style={[
                                    styles.sectionValue,
                                    { color: colors.text, textAlign: isRTL ? "left" : "" }
                                ]}>
                                    {collection.financials && collection.financials.length > 0 
                                        ? collection.financials.map((f, index) => (
                                            `${f.currency_code}: ${f.checks_value || 0}${index < collection.financials.length - 1 ? ' | ' : ''}`
                                        )).join('')
                                        : '-'}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
                
                {/* Order IDs */}
                {/* <View style={[
                    styles.infoSection,
                    { backgroundColor: colors.surface }
                ]}>
                    <View style={[styles.sectionRow]}>
                        <View style={[
                            styles.iconWrapper,
                            { backgroundColor: '#3A0CA3' }
                        ]}>
                            <MaterialCommunityIcons name="identifier" size={20} color="#ffffff" />
                        </View>
                        <View style={[
                            styles.sectionContent,
                            {
                                ...Platform.select({
                                    ios: {
                                        alignItems: isRTL ? "flex-start" : ""
                                    }
                                }),
                            }
                        ]}>
                            <Text style={[
                                styles.sectionTitle,
                                { color: colors.textSecondary }
                            ]}>
                                {translations[language]?.collections?.collection?.orderIds || "Order IDs"}
                            </Text>
                            <Text style={[
                                styles.sectionValue,
                                { color: colors.text }
                            ]}>
                                {collection.order_ids}
                            </Text>
                        </View>
                    </View>
                </View> */}

                {/* Business Information */}
                {collection.sub_orders && collection.sub_orders.length > 0 && (
                    <>
                        <View style={[
                            styles.infoSection,
                            { backgroundColor: colors.surface }
                        ]}>
                            <View style={[styles.sectionRow]}>
                                <View style={[
                                    styles.iconWrapper,
                                    { backgroundColor: '#4361EE' }
                                ]}>
                                    <MaterialCommunityIcons name="office-building" size={20} color="#ffffff" />
                                </View>
                                <View style={[
                                    styles.sectionContent,
                                    {
                                        ...Platform.select({
                                            ios: {
                                                alignItems: isRTL ? "flex-start" : ""
                                            }
                                        }),
                                    }
                                ]}>
                                    <Text style={[
                                        styles.sectionTitle,
                                        { color: colors.textSecondary }
                                    ]}>
                                        {translations[language]?.collections?.collection?.businessName || "Business Name"}
                                    </Text>
                                    <Text style={[
                                        styles.sectionValue,
                                        { color: colors.text }
                                    ]}>
                                        {collection.sub_orders[0].business_name}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View style={[
                            styles.infoSection,
                            { backgroundColor: colors.surface }
                        ]}>
                            <View style={[styles.sectionRow]}>
                                <View style={[
                                    styles.iconWrapper,
                                    { backgroundColor: colors.primary }
                                ]}>
                                    <Feather name="phone" size={20} color="#ffffff" />
                                </View>
                                <View style={[
                                    styles.sectionContent,
                                    {
                                        ...Platform.select({
                                            ios: {
                                                alignItems: isRTL ? "flex-start" : ""
                                            }
                                        }),
                                    }
                                ]}>
                                    <Text style={[
                                        styles.sectionTitle,
                                        { color: colors.textSecondary }
                                    ]}>
                                        {translations[language]?.collections?.collection?.businessPhone || "Business Phone"}
                                    </Text>
                                    <View style={styles.phoneContainer}>
                                        <Text style={[
                                            styles.sectionValue,
                                            { color: colors.text, flex: 1 }
                                        ]}>
                                            {collection.sub_orders[0].business_phone}
                                        </Text>
                                        <View style={styles.contactButtonsContainer}>
                                            <TouchableOpacity 
                                                style={[styles.contactButton, styles.callButton]}
                                                onPress={() => handlePhoneCall(collection.sub_orders[0].business_phone)}
                                            >
                                                <FontAwesome name="phone" size={16} color="#ffffff" />
                                            </TouchableOpacity>
                                            
                                            <TouchableOpacity 
                                                style={[styles.contactButton, styles.whatsappButton]}
                                                onPress={() => {
                                                    setCurrentPhone(collection.sub_orders[0].business_phone);
                                                    setShowPhoneOptions(true);
                                                }}
                                            >
                                                <FontAwesome name="whatsapp" size={16} color="#ffffff" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={[
                            styles.infoSection,
                            { backgroundColor: colors.surface }
                        ]}>
                            <View style={[styles.sectionRow]}>
                                <View style={[
                                    styles.iconWrapper,
                                    { backgroundColor: '#10B981' }
                                ]}>
                                    <Ionicons name="location-outline" size={20} color="#ffffff" />
                                </View>
                                <View style={[
                                    styles.sectionContent,
                                    {
                                        ...Platform.select({
                                            ios: {
                                                alignItems: isRTL ? "flex-start" : ""
                                            }
                                        }),
                                    }
                                ]}>
                                    <Text style={[
                                        styles.sectionTitle,
                                        { color: colors.textSecondary }
                                    ]}>
                                        {translations[language]?.collections?.collection?.businessLocation || "Business Location"}
                                    </Text>
                                    <Text style={[
                                        styles.sectionValue,
                                        { color: colors.text }
                                    ]}>
                                        {collection.sub_orders[0].business_city} | {collection.sub_orders[0].business_address}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </>
                )}

                {/* Branch section */}
                {(type === "returned" || type === "dispatched") && (
                    <View style={[
                        styles.infoSection,
                        { backgroundColor: colors.surface }
                    ]}>
                        <View style={[styles.sectionRow]}>
                            <View style={[
                                styles.iconWrapper, 
                                { backgroundColor: '#4CC9F0' }
                            ]}>
                                <Ionicons name="git-branch-outline" size={20} color="#ffffff" />
                            </View>
                            <View style={[
                                styles.sectionContent,
                                {
                                    ...Platform.select({
                                        ios: {
                                            alignItems: isRTL ? "flex-start" : ""
                                        }
                                    }),
                                }
                            ]}>
                                <Text style={[
                                    styles.sectionTitle,
                                    { color: colors.textSecondary }
                                ]}>
                                    {translations[language].collections.collection.currentBranch}
                                </Text>
                                <Text style={[
                                    styles.sectionValue,
                                    { color: colors.text }
                                ]}>
                                    {collection.current_branch_name}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
                
                {/* To branch section */}
                {type === "dispatched" && (
                    <View style={[
                        styles.infoSection,
                        { backgroundColor: colors.surface }
                    ]}>
                        <View style={[styles.sectionRow]}>
                            <View style={[
                                styles.iconWrapper, 
                                { backgroundColor: '#7209B7' }
                            ]}>
                                <Ionicons name="git-branch-outline" size={20} color="#ffffff" />
                            </View>
                            <View style={[
                                styles.sectionContent,
                                {
                                    ...Platform.select({
                                        ios: {
                                            alignItems: isRTL ? "flex-start" : ""
                                        }
                                    }),
                                }
                            ]}>
                                <Text style={[
                                    styles.sectionTitle,
                                    { color: colors.textSecondary }
                                ]}>
                                    {translations[language].collections.collection.toBranch}
                                </Text>
                                <Text style={[
                                    styles.sectionValue,
                                    { color: colors.text }
                                ]}>
                                    {collection.to_branch_name}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
            </View>
            
            {/* Action buttons */}
            <View style={styles.actionsContainer}>
                {type !== "sent" && (
                    <TouchableOpacity 
                        style={[
                            styles.actionButton,
                            { backgroundColor: isDark ? 'rgba(108, 142, 255, 0.15)' : 'rgba(67, 97, 238, 0.1)' }
                        ]}
                        onPress={() => router.push({
                            pathname: "/(tabs)/orders",
                            params: { orderIds: collection.order_ids, reset: "true" }
                        })}
                        activeOpacity={0.7}
                    >
                        <View style={[
                            styles.actionIconContainer,
                            { backgroundColor: colors.primary }
                        ]}>
                            <MaterialCommunityIcons name="package-variant" size={18} color="#ffffff" />
                        </View>
                        <Text style={[
                            styles.actionText,
                            { color: colors.primary }
                        ]}>
                            {translations[language].collections.collection.orders}
                        </Text>
                    </TouchableOpacity>
                )}
                
                {/* PDF Export Button */}
                <TouchableOpacity 
                    style={[
                        styles.actionButton,
                        { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)' }
                    ]}
                    onPress={generatePDF}
                    activeOpacity={0.7}
                    disabled={isPdfLoading}
                >
                    {isPdfLoading ? (
                        <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                        <>
                            <View style={[
                                styles.actionIconContainer,
                                { backgroundColor: '#EF4444' }
                            ]}>
                                <FontAwesome5 name="file-pdf" size={18} color="#ffffff" />
                            </View>
                            <Text style={[
                                styles.actionText,
                                { color: '#EF4444' }
                            ]}>
                                {translations[language]?.collections?.collection?.exportPdf || "Export PDF"}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
                

                
                {/* WhatsApp Options Modal */}
                <ModalPresentation
                    showModal={showPhoneOptions}
                    setShowModal={setShowPhoneOptions}
                    customStyles={{ bottom: 15 }}
                    position="bottom"
                >
                    <View style={[
                        styles.modalHeader,
                        { borderBottomColor: colors.border }
                    ]}>
                        <Text style={[
                            styles.modalHeaderText,
                            { color: colors.text }
                        ]}>
                            {translations[language]?.collections?.collection?.whatsappOptions || "WhatsApp Options"}
                        </Text>
                    </View>
                    <View style={styles.modalContent}>
                        <TouchableOpacity
                            style={[
                                styles.modalOption,
                                { borderBottomColor: colors.border }
                            ]}
                            onPress={() => {
                                handleWhatsApp972(currentPhone);
                                setShowPhoneOptions(false);
                            }}
                        >
                            <View style={[styles.modalIconContainer, styles.whatsappIcon]}>
                                <FontAwesome name="whatsapp" size={20} color="#ffffff" />
                            </View>
                            <Text style={[
                                styles.modalOptionText,
                                { color: colors.text }
                            ]}>
                                {translations[language]?.collections?.collection?.whatsapp || "WhatsApp"} (972)
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[
                                styles.modalOption, 
                                styles.noBorder
                            ]}
                            onPress={() => {
                                handleWhatsApp970(currentPhone);
                                setShowPhoneOptions(false);
                            }}
                        >
                            <View style={[styles.modalIconContainer, styles.whatsappIcon]}>
                                <FontAwesome name="whatsapp" size={20} color="#ffffff" />
                            </View>
                            <Text style={[
                                styles.modalOptionText,
                                { color: colors.text }
                            ]}>
                                {translations[language]?.collections?.collection?.whatsapp || "WhatsApp"} (970)
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ModalPresentation>
                
                {/* Business package request */}
                {/* {(user.role === "business" && collection.status_key === "returned_in_branch") && (
                    <>
                        <TouchableOpacity 
                            style={[
                                styles.actionButton,
                                { backgroundColor: isDark ? 'rgba(108, 142, 255, 0.15)' : 'rgba(67, 97, 238, 0.1)' }
                            ]}
                            onPress={() => setShowModal(true)}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.actionIconContainer,
                                { backgroundColor: '#F72585' }
                            ]}>
                                <FontAwesome6 name="money-bill-trend-up" size={18} color="#ffffff" />
                            </View>
                            <Text style={[
                                styles.actionText,
                                { color: colors.primary }
                            ]}>
                                {translations[language].collections.collection.request_package}
                            </Text>
                        </TouchableOpacity>
                        
                        <ModalPresentation 
                            customStyles={{bottom: 15}} 
                            showModal={showModal} 
                            setShowModal={setShowModal}
                        >
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalHeaderText]}>
                                    {translations[language]?.collections?.collection?.actions}
                                </Text>
                            </View>
                            
                            <TouchableOpacity
                                style={[styles.modalOption]}
                                onPress={() => handleCollectNotification("package", "prepare")}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#4361EE" size="small" />
                                ) : (
                                    <>
                                        <View style={[
                                            styles.modalIconContainer,
                                            { backgroundColor: '#4361EE' }
                                        ]}>
                                            <MaterialIcons name="inventory" size={18} color="#ffffff" />
                                        </View>
                                        <Text style={[styles.modalOptionText]}>
                                            {translations[language].collections.collection.prepare_package}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[styles.modalOption, styles.noBorder]}
                                onPress={() => handleCollectNotification("package", "send")}
                                disabled={isLoading}
                            >
                                <View style={[
                                    styles.modalIconContainer,
                                    { backgroundColor: '#F72585' }
                                ]}>
                                    <Feather name="send" size={18} color="#ffffff" />
                                </View>
                                <Text style={[styles.modalOptionText]}>
                                    {translations[language].collections.collection.send_package}
                                </Text>
                            </TouchableOpacity>
                        </ModalPresentation>
                    </>
                )} */}
                
                {/* Business money request */}
                {/* {(user.role === "business" && collection.status_key === "money_in_branch") && (
                    <>
                        <TouchableOpacity 
                            style={[styles.actionButton]}
                            onPress={() => setShowModal(true)}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.actionIconContainer,
                                { backgroundColor: '#F72585' }
                            ]}>
                                <FontAwesome6 name="money-bill-trend-up" size={18} color="#ffffff" />
                            </View>
                            <Text style={styles.actionText}>
                                {translations[language].collections.collection.request_money}
                            </Text>
                        </TouchableOpacity>
                        
                        <ModalPresentation 
                            customStyles={{bottom: 15}} 
                            showModal={showModal} 
                            setShowModal={setShowModal}
                        >
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalHeaderText]}>
                                    {translations[language]?.collections?.collection?.actions}
                                </Text>
                            </View>
                            
                            <TouchableOpacity
                                style={[styles.modalOption]}
                                onPress={() => handleCollectNotification("money", "prepare")}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#4361EE" size="small" />
                                ) : (
                                    <>
                                        <View style={[
                                            styles.modalIconContainer,
                                            { backgroundColor: '#4361EE' }
                                        ]}>
                                            <MaterialIcons name="payments" size={18} color="#ffffff" />
                                        </View>
                                        <Text style={[styles.modalOptionText]}>
                                            {translations[language].collections.collection.prepare_money}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[styles.modalOption, styles.noBorder]}
                                onPress={() => handleCollectNotification("money", "send")}
                                disabled={isLoading}
                            >
                                <View style={[
                                    styles.modalIconContainer,
                                    { backgroundColor: '#F72585' }
                                ]}>
                                    <Feather name="send" size={18} color="#ffffff" />
                                </View>
                                <Text style={[styles.modalOptionText]}>
                                    {translations[language].collections.collection.send_money}
                                </Text>
                            </TouchableOpacity>
                        </ModalPresentation>
                    </>
                )} */}
            </View>
            
        </View>
    );
}

export default React.memo(Collection, (prevProps, nextProps) => {
    // Only re-render if collection ID, status, or type changes
    return (
        prevProps.collection.collection_id === nextProps.collection.collection_id &&
        prevProps.collection.status_key === nextProps.collection.status_key &&
        prevProps.type === nextProps.type
    );
});

const styles = StyleSheet.create({
    collectionCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
        backgroundColor: 'rgba(67, 97, 238, 0.05)',
    },
    idSection: {
        flex: 1,
    },
    idContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12
    },
    idLabel: {
        fontSize: 14,
        color: '#64748B'
    },
    idText: {
        fontWeight: '700',
        fontSize: 16,
        color: '#4361EE',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 30,
        paddingHorizontal: 12,
        paddingVertical: 6,
        minWidth: 100,
    },
    statusText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 13,
        textAlign: 'center',
        flex: 1,
    },
    contentContainer: {
        padding: 16,
    },
    userInfoSection: {
        marginBottom: 8,
    },
    infoSection: {
        backgroundColor: 'rgba(249, 250, 251, 1)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    sectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    iconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    sectionContent: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
        marginBottom: 4,
    },
    sectionValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    actionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
        paddingTop: 0,
        gap: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(67, 97, 238, 0.1)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        gap: 12
    },
    actionIconContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center'
    },
    actionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#4361EE',
    },
    confirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10B981',
        margin: 16,
        marginTop: 0,
        padding: 12,
        borderRadius: 12,
        shadowColor: "#10B981",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    confirmButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: 'white',
    },
    modalHeader: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
    },
    modalHeaderText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    modalContent: {
        padding: 16,
    },
    modalOption: {
        flexDirection: 'row',
        gap:12,
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
    },
    modalIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalOptionText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    noBorder: {
        borderBottomWidth: 0,
    },

    // Contact button styles
    contactButtonsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    contactButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    callButton: {
        backgroundColor: '#4361EE',
    },
    whatsappButton: {
        backgroundColor: '#25D366',
    },
    whatsappIcon: {
        backgroundColor: '#25D366',
    },
    phoneContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
});