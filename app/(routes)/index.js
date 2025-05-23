import { View, StyleSheet, Text, TouchableOpacity, Modal, TextInput, Alert, FlatList, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useLanguage } from '../../utils/languageContext';
import { useAuth } from "../../RootLayout";
import { translations } from '../../utils/languageContext';
import { getToken } from "../../utils/secureStore";
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
// import * as Location from 'expo-location';
import { useSocket } from '../../utils/socketContext';

export default function Routes() {
    const socket = useSocket();
    const { language } = useLanguage();
    const isRTL = ["he", "ar"].includes(language);
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [routes, setRoutes] = useState([]);
    const [activeTab, setActiveTab] = useState('active');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [routeName, setRouteName] = useState('');
    const [location, setLocation] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    
    // Check if user has appropriate role
    const isAllowed = ["driver", "delivery_company"].includes(user?.role);
    
    useEffect(() => {
        if (!socket) return;

        const handleRouteUpdate = (notification) => {
            switch (notification.type) {
                case 'ROUTE_UPDATED':
                    fetchRoutes();
                    break;
                default:
                    break;
            }
        };

        socket.on('routeUpdate', handleRouteUpdate);

        return () => {
            socket.off('routeUpdate', handleRouteUpdate);
        };
    }, [socket])

    useEffect(() => {
        if (!isAllowed) {
            // Redirect if not an allowed user
            Alert.alert(
                translations[language]?.common?.accessDenied || "Access Denied",
                translations[language]?.routes?.accessDeniedMessage || "This feature is only available for drivers and delivery companies.",
                [{ text: "OK", onPress: () => router.replace("/(tabs)/index") }]
            );
            return;
        }
        
        // // Get location permission
        // (async () => {
        //     let { status } = await Location.requestForegroundPermissionsAsync();
        //     if (status !== 'granted') {
        //         return;
        //     }
            
        //     let currentLocation = await Location.getCurrentPositionAsync({});
        //     setLocation(currentLocation);
        // })();
        
        // Load routes
        fetchRoutes();
    }, [isAllowed, language]);
    
    const fetchRoutes = async () => {
        setLoading(true);
        try {
            const token = await getToken("userToken");
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/driver/routes?language_code=${language}`, {
                method: "GET",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
                    "Cookie": token ? `token=${token}` : ""
                }
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setRoutes(data.routes || []);
                } else {
                    Alert.alert(
                        translations[language]?.common?.error || "Error",
                        data.message || translations[language]?.common?.errorOccurred || "An error occurred"
                    );
                }
            } else {
                Alert.alert(
                    translations[language]?.common?.error || "Error",
                    translations[language]?.common?.fetchFailed || "Failed to fetch routes"
                );
            }
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };
    
    const handleCreateRoute = () => {
        setShowCreateModal(true);
    };
    
    const handleSaveNewRoute = async () => {
        if (!routeName.trim()) {
            Alert.alert(
                translations[language]?.routes?.error || "Error",
                translations[language]?.routes?.enterRouteName || "Please enter a route name"
            );
            return;
        }
        
        setIsSubmitting(true);
        try {
            const token = await getToken("userToken");
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/driver/routes`, {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
                    "Cookie": token ? `token=${token}` : "",
                    "Accept-Language": language
                },
                body: JSON.stringify({ name: routeName.trim() })
            });
            
            const data = await res.json();
            
            if (res.ok && data.success) {
                setRoutes(prev => [data.route, ...prev]);
                setRouteName('');
                setShowCreateModal(false);
                
                // Navigate to route detail page to add orders
                router.push({
                    pathname: "/(routes)/detail",
                    params: { routeId: data.route.id }
                });
            } else {
                Alert.alert(
                    translations[language]?.common?.error || "Error",
                    data.message || translations[language]?.common?.errorOccurred || "Failed to create route"
                );
            }
        } catch (error) {
            Alert.alert(
                translations[language]?.common?.error || "Error",
                translations[language]?.common?.errorOccurred || "An error occurred"
            );
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDeleteRoute = (route) => {
        setSelectedRoute(route);
        setShowDeleteModal(true);
    };
    
    const confirmDeleteRoute = async () => {
        if (!selectedRoute) return;
        
        setIsSubmitting(true);
        try {
            const token = await getToken("userToken");
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/driver/routes/${selectedRoute.id}`, {
                method: "DELETE",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
                    "Cookie": token ? `token=${token}` : "",
                    "Accept-Language": language
                }
            });
            
            const data = await res.json();
            
            if (res.ok && data.success) {
                setRoutes(routes.filter(r => r.id !== selectedRoute.id));
                Alert.alert(
                    translations[language]?.common?.success || "Success",
                    data.message || translations[language]?.routes?.routeDeleted || "Route deleted successfully"
                );
            } else {
                Alert.alert(
                    translations[language]?.common?.error || "Error",
                    data.message || translations[language]?.common?.errorOccurred || "Failed to delete route"
                );
            }
        } catch (error) {
            Alert.alert(
                translations[language]?.common?.error || "Error",
                translations[language]?.common?.errorOccurred || "An error occurred"
            );
        } finally {
            setShowDeleteModal(false);
            setSelectedRoute(null);
            setIsSubmitting(false);
        }
    };
    
    const handleEditRoute = (route) => {
        router.push({
            pathname: "/(routes)/detail",
            params: { routeId: route.id }
        });
    };
    
    const handleViewRoute = (route) => {
        router.push({
            pathname: "/(routes)/navigate",
            params: { routeId: route.id }
        });
    };
    
    // Filter the routes based on the active tab
    const filteredRoutes = routes.filter(route => {
        if (activeTab === 'active') return route.status === 'active';
        if (activeTab === 'completed') return route.status === 'completed';
        return true;
    });
    
    // Renders each route item in the list
    const renderRouteItem = ({ item }) => {
        const orderCount = item.orders?.length || 0;
        const deliveredCount = item.orders?.filter(o => o.status === 'delivered').length || 0;
        const isCompletedRoute = item.status === 'completed';
        
        return (
            <TouchableOpacity
                style={[styles.routeCard, isCompletedRoute && styles.completedRoute]}
                onPress={() => handleEditRoute(item)}
                activeOpacity={0.7}
            >
                <View style={[styles.routeHeader]}>
                    <View style={styles.routeIconContainer}>
                        <MaterialCommunityIcons name="routes" size={22} color="#fff" />
                    </View>
                    
                    <View style={styles.routeTitleContainer}>
                        <Text style={[styles.routeName]}>
                            {item.name}
                        </Text>
                        <Text style={[styles.routeDate]}>
                            {new Date(item.created_at).toLocaleDateString(
                                'en-US',
                                { year: 'numeric', month: 'short', day: 'numeric' }
                            )}
                        </Text>
                    </View>
                    
                    <View style={styles.routeActions}>
                        <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={() => handleDeleteRoute(item)}
                        >
                            <Feather name="trash-2" size={18} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </View>
                
                <View style={styles.routeStats}>
                    <View style={[styles.statItem]}>
                        <Feather name="package" size={16} color="#64748B" />
                        <Text style={[styles.statText]}>
                            {orderCount} {translations[language]?.routes?.orders || "Orders"}
                        </Text>
                    </View>
                    
                    {isCompletedRoute ? (
                        <View style={[styles.statItem]}>
                            <Feather name="check-circle" size={16} color="#10B981" />
                            <Text style={[styles.statText]}>
                                {translations[language]?.routes?.completed || "Completed"}
                            </Text>
                        </View>
                    ) : (
                        <View style={[styles.statItem]}>
                            <Feather name="check-circle" size={16} color="#10B981" />
                            <Text style={[styles.statText]}>
                                {deliveredCount}/{orderCount} {translations[language]?.routes?.delivered || "Delivered"}
                            </Text>
                        </View>
                    )}
                    
                    {item.optimized ? (
                        <View style={[styles.statItem]}>
                            <MaterialIcons name="route" size={16} color="#4361EE" />
                            <Text style={[styles.statText]}>
                                {translations[language]?.routes?.optimized || "Optimized"}
                            </Text>
                        </View>
                    ) : null}
                </View>
                
                <View style={styles.routeButtons}>
                    <TouchableOpacity 
                        style={[styles.routeButton, styles.editButton]} 
                        onPress={() => handleEditRoute(item)}
                        disabled={isCompletedRoute}
                    >
                        <Feather name="edit" size={16} color="#4361EE" />
                        <Text style={styles.buttonText}>
                            {translations[language]?.routes?.edit || "Edit"}
                        </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.routeButton, styles.navigateButton]} 
                        onPress={() => handleViewRoute(item)}
                    >
                        <Feather name="navigation" size={16} color="#FFFFFF" />
                        <Text style={styles.navigateButtonText}>
                            {translations[language]?.routes?.navigate || "Navigate"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };
    
    if (!isAllowed) {
        return null; // Will be redirected in useEffect
    }
    
    return (
        <View style={styles.container}>
            <View style={styles.tabBar}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'active' && styles.activeTab]}
                    onPress={() => setActiveTab('active')}
                >
                    <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
                        {translations[language]?.routes?.activeTabs || "Active Routes"}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
                    onPress={() => setActiveTab('completed')}
                >
                    <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
                        {translations[language]?.routes?.completedTabs || "Completed"}
                    </Text>
                </TouchableOpacity>
            </View>
            
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4361EE" />
                    <Text style={styles.loadingText}>
                        {translations[language]?.common?.loading || "Loading..."}
                    </Text>
                </View>
            ) : filteredRoutes.length > 0 ? (
                <FlatList
                    data={filteredRoutes}
                    renderItem={renderRouteItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.routesList}
                    showsVerticalScrollIndicator={false}
                    refreshing={loading}
                    onRefresh={fetchRoutes}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconContainer}>
                        <MaterialCommunityIcons name="routes" size={40} color="#4361EE" />
                    </View>
                    <Text style={styles.emptyText}>
                        {activeTab === 'active' 
                            ? translations[language]?.routes?.noActiveRoutes || "No active routes" 
                            : translations[language]?.routes?.noCompletedRoutes || "No completed routes"}
                    </Text>
                    <Text style={styles.emptySubtext}>
                        {translations[language]?.routes?.createRoutePrompt || "Create a new route to organize your deliveries"}
                    </Text>
                </View>
            )}
            
            <TouchableOpacity 
                style={styles.fab}
                onPress={handleCreateRoute}
            >
                <LinearGradient
                    colors={['#4361EE', '#3A0CA3']}
                    style={styles.fabGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Feather name="plus" size={24} color="#FFFFFF" />
                </LinearGradient>
            </TouchableOpacity>
            
            {/* Create Route Modal */}
            <Modal
                visible={showCreateModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowCreateModal(false)}
            >
                <BlurView intensity={80} style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {translations[language]?.routes?.createRoute || "Create New Route"}
                            </Text>
                            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                                <Feather name="x" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>
                                {translations[language]?.routes?.routeName || "Route Name"}
                            </Text>
                            <View style={styles.inputWrapper}>
                                <Feather name="tag" size={20} color="#64748B" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input]}
                                    placeholder={translations[language]?.routes?.enterRouteName || "Enter route name"}
                                    value={routeName}
                                    onChangeText={setRouteName}
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>
                        </View>
                        
                        <TouchableOpacity 
                            style={styles.createButton}
                            onPress={handleSaveNewRoute}
                            disabled={isSubmitting}
                        >
                            <LinearGradient
                                colors={['#4361EE', '#3A0CA3']}
                                style={styles.createButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.createButtonText}>
                                        {translations[language]?.routes?.create || "Create Route"}
                                    </Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </BlurView>
            </Modal>
            
            {/* Delete Confirmation Modal */}
            <Modal
                visible={showDeleteModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowDeleteModal(false)}
            >
                <BlurView intensity={80} style={styles.modalOverlay}>
                    <View style={styles.confirmModalContainer}>
                        <View style={styles.confirmIconContainer}>
                            <Feather name="alert-triangle" size={32} color="#EF4444" />
                        </View>
                        
                        <Text style={styles.confirmTitle}>
                            {translations[language]?.routes?.deleteRouteTitle || "Delete Route"}
                        </Text>
                        
                        <Text style={styles.confirmText}>
                            {translations[language]?.routes?.deleteRouteConfirm || "Are you sure you want to delete this route? This action cannot be undone."}
                        </Text>
                        
                        <View style={styles.confirmButtons}>
                            <TouchableOpacity 
                                style={styles.cancelButton}
                                onPress={() => setShowDeleteModal(false)}
                                disabled={isSubmitting}
                            >
                                <Text style={styles.cancelButtonText}>
                                    {translations[language]?.common?.cancel || "Cancel"}
                                </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.deleteButton}
                                onPress={confirmDeleteRoute}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.deleteButtonText}>
                                        {translations[language]?.common?.delete || "Delete"}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </BlurView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderRadius: 8,
        margin: 16,
        padding: 4,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 6,
    },
    activeTab: {
        backgroundColor: '#EBF5FF',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
    },
    activeTabText: {
        color: '#4361EE',
        fontWeight: '600',
    },
    routesList: {
        padding: 16,
        paddingBottom: 80, // Extra space for FAB
    },
    routeCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        marginBottom: 16,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    completedRoute: {
        opacity: 0.8,
    },
    routeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap:10
    },
    routeIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4361EE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    routeTitleContainer: {
        flex: 1,
    },
    routeName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    routeDate: {
        fontSize: 12,
        color: '#64748B',
    },
    routeActions: {
        flexDirection: 'row',
        gap:10
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    routeStats: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 12,
        gap:10
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap:4
    },
    statText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500'
    },
    routeButtons: {
        flexDirection: 'row',
    },
    routeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
    },
    editButton: {
        backgroundColor: 'rgba(67, 97, 238, 0.1)',
        gap:4,
    },
    navigateButton: {
        backgroundColor: '#4361EE',
        gap:4,
    },
    buttonText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#4361EE',
    },
    navigateButtonText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        shadowColor: '#4361EE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    fabGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#64748B',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(67, 97, 238, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        maxWidth: 240,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        height: 48,
        fontSize: 16,
        color: '#333',
    },
    createButton: {
        borderRadius: 8,
        overflow: 'hidden',
        marginTop: 8,
    },
    createButtonGradient: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    confirmModalContainer: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
    },
    confirmIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    confirmTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    confirmText: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
    },
    confirmButtons: {
        flexDirection: 'row',
        width: '100%',
        gap:10
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#64748B',
    },
    deleteButton: {
        flex: 1,
        paddingVertical: 12,
        backgroundColor: '#EF4444',
        borderRadius: 8,
        marginLeft: 8,
        alignItems: 'center',
    },
    deleteButtonText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#fff',
    },
});