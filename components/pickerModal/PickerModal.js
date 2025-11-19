import { StyleSheet, Modal, View, Text, TouchableOpacity, TextInput, Platform, Dimensions, ActivityIndicator, KeyboardAvoidingView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';
import FlatListData from "../FlatListData";
import { useState, useMemo, useEffect, useCallback } from 'react';

export default function PickerModal({
    list: initialList, 
    showPickerModal, 
    setShowModal, 
    setSelectedValue, 
    field, 
    loading: externalLoading, 
    loadMoreData: externalLoadMoreData, 
    loadingMore: externalLoadingMore, 
    setFieldErrors, 
    allowClear = false, 
    error: externalError, 
    onRetry: externalOnRetry,
    keyExtractor, // Custom key extractor function
    // External search props
    prickerSearchValue = "",
    setPickerSearchValue = null,
    onSearchClear = null,
    // API search configuration
    apiConfig = null // { endpoint, searchParam, language }
}) {
    const { language } = useLanguage();
    const { colorScheme, isDark } = useTheme();
    const colors = Colors[colorScheme];
    const { name } = field;
    const [modalHeight, setModalHeight] = useState(Dimensions.get('window').height * 0.7);
    const isRTL = language === 'ar' || language === 'he';
    const insets = useSafeAreaInsets();
    
    // Internal state for API-based search
    const [internalSearchValue, setInternalSearchValue] = useState("");
    const [debouncedSearchValue, setDebouncedSearchValue] = useState("");
    
    // Use external search value if provided, otherwise use internal
    const searchValue = setPickerSearchValue ? prickerSearchValue : internalSearchValue;
    const originalSetSearchValue = setPickerSearchValue || setInternalSearchValue;
    
    // Wrapper function for debugging
    const setSearchValue = (value) => {
        originalSetSearchValue(value);
    };
    
    const [internalList, setInternalList] = useState([]);
    const [internalLoading, setInternalLoading] = useState(false);
    const [internalLoadingMore, setInternalLoadingMore] = useState(false);
    const [internalError, setInternalError] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [isSearchMode, setIsSearchMode] = useState(false);

    // Determine if we should use API search or static list
    const useApiSearch = !!(apiConfig && apiConfig.endpoint);

    // Use internal state for API search, external props for static list
    const displayList = useApiSearch ? internalList : initialList;
    const isLoading = useApiSearch ? internalLoading : externalLoading;
    const isLoadingMore = useApiSearch ? internalLoadingMore : externalLoadingMore;
    const currentError = useApiSearch ? internalError : externalError;

    // Debounce search value
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchValue(searchValue);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchValue]);

    // API fetch function
    const fetchData = useCallback(async (page = 1, searchTerm = '', loadMore = false) => {
        if (!useApiSearch) return;

        try {
            if (!loadMore) {
                setInternalLoading(true);
            } else {
                setInternalLoadingMore(true);
            }
            setInternalError(null);

            // Build query parameters
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
            });

            // Add parameters from apiConfig.params
            if (apiConfig.params) {
                Object.entries(apiConfig.params).forEach(([key, value]) => {
                    params.append(key, value);
                });
            }

            // Add extra parameters from apiConfig (for backward compatibility)
            if (apiConfig.extraParams) {
                Object.entries(apiConfig.extraParams).forEach(([key, value]) => {
                    params.append(key, value);
                });
            }

            // Add search parameter if provided
            if (searchTerm.trim()) {
                params.append(apiConfig.searchParam || 'name', searchTerm.trim());
            }

            const response = await fetch(`${apiConfig.endpoint}?${params}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
                    'Accept-Language': language,
                    ...apiConfig.headers
                }
            });

            // Read response text first
            const responseText = await response.text();
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}. Response: ${responseText.substring(0, 200)}`);
            }

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (jsonError) {
                console.error('JSON Parse Error. Response was:', responseText.substring(0, 500));
                throw new Error(`Invalid JSON response from server. Expected JSON but got: ${responseText.substring(0, 100)}...`);
            }
            
            // Extract data using apiConfig dataPath
            const newItems = apiConfig.dataPath ? 
                apiConfig.dataPath.split('.').reduce((obj, key) => obj?.[key], data) || [] : 
                (data.data || []);
            
            if (loadMore) {
                setInternalList(prev => [...prev, ...newItems]);
            } else {
                setInternalList(newItems);
            }

            // Update pagination info using apiConfig paths
            const totalPages = apiConfig.totalPagesPath ? 
                apiConfig.totalPagesPath.split('.').reduce((obj, key) => obj?.[key], data) : 
                (data.pagination ? data.pagination.total_pages : null);
            
            const currentPageFromResponse = apiConfig.currentPagePath ? 
                apiConfig.currentPagePath.split('.').reduce((obj, key) => obj?.[key], data) : 
                (data.pagination ? data.pagination.current_page : page);
            
            setHasMore(totalPages ? currentPageFromResponse < totalPages : false);
            setCurrentPage(currentPageFromResponse || page);

        } catch (error) {
            console.error('Error fetching data:', error);
            setInternalError(error.message);
        } finally {
            setInternalLoading(false);
            setInternalLoadingMore(false);
        }
    }, [useApiSearch, apiConfig, language]);

    // Load initial data when modal opens
    useEffect(() => {
        if (showPickerModal && useApiSearch) {
            setInternalList([]);
            setCurrentPage(1);
            setHasMore(true);
            setIsSearchMode(false);
            fetchData(1, '', false);
        }
    }, [showPickerModal, useApiSearch, fetchData]);

    // Handle search
    useEffect(() => {
        if (!useApiSearch) return;

        if (debouncedSearchValue) {
            setIsSearchMode(true);
            setCurrentPage(1);
            setHasMore(true);
            fetchData(1, debouncedSearchValue, false);
        } else if (isSearchMode) {
            // Search was cleared, reload initial data
            setIsSearchMode(false);
            setCurrentPage(1);
            setHasMore(true);
            fetchData(1, '', false);
        }
    }, [debouncedSearchValue, useApiSearch, fetchData, isSearchMode]);

    // Load more function
    const handleLoadMore = useCallback(async () => {
        
        if (!useApiSearch) {
            // Use external load more for static lists
            if (externalLoadMoreData) {
                externalLoadMoreData();
            }
            return;
        }

        if (isLoading || isLoadingMore || !hasMore) return;
        
        const nextPage = currentPage + 1;
        await fetchData(nextPage, isSearchMode ? debouncedSearchValue : '', true);
    }, [useApiSearch, isLoading, isLoadingMore, hasMore, currentPage, fetchData, isSearchMode, debouncedSearchValue, externalLoadMoreData]);

    // Filter list for local search (when not using API)
    const filteredList = useMemo(() => {
        if (useApiSearch) {
            return displayList; // API handles filtering
        }
        
        if (!searchValue || !displayList?.length) return displayList;
        
        return displayList.filter(item => {
            const searchText = searchValue.toLowerCase();
            const itemLabel = (item.label || item.name || '').toLowerCase();
            return itemLabel.includes(searchText);
        });
    }, [displayList, searchValue, useApiSearch]);

    // Final list to display
    const finalList = useApiSearch ? displayList : filteredList;

    // Handle modal close
    const handleCloseModal = () => {
        // Clear search using external function if provided, otherwise use internal
        if (onSearchClear) {
            onSearchClear();
        } else {
            setSearchValue("");
        }
        setDebouncedSearchValue("");
        if (useApiSearch) {
            setInternalList([]);
            setInternalError(null);
            setIsSearchMode(false);
        }
        setShowModal(false);
    };

    // Handle clear selection
    const handleClearSelection = () => {
        if (typeof setSelectedValue === 'function') {
            setSelectedValue((prevValue) => {
                const newValue = {...prevValue};
                newValue[name] = null;
                return newValue;
            });
        }
        handleCloseModal();
    };

    // Handle retry
    const handleRetry = () => {
        if (useApiSearch) {
            if (isSearchMode) {
                fetchData(1, debouncedSearchValue, false);
            } else {
                fetchData(1, '', false);
            }
        } else if (externalOnRetry) {
            externalOnRetry();
        }
    };

    return (
        <Modal
            animationType="slide"
            visible={showPickerModal}
            onRequestClose={handleCloseModal}
            transparent
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
            >
                <SafeAreaView style={styles.safeArea}>
                    <View style={[styles.contentWrapper, { 
                        height: modalHeight,
                        backgroundColor: colors.background,
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        paddingBottom: insets.bottom,
                    }]}>
                        {/* Header */}
                        <View style={[styles.header, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.title, { color: colors.text }]}>
                                {field.label || translations[language].picker.selectOption}
                            </Text>
                            <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Search Bar */}
                        {field.showSearchBar && (
                            <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground }]}>
                                <Ionicons 
                                    name="search" 
                                    size={20} 
                                    color={colors.textSecondary} 
                                />
                                <TextInput
                                    style={[
                                        styles.searchInput,
                                        { color: colors.inputText },
                                        {
                                            ...Platform.select({
                                                ios: {
                                                    textAlign: isRTL ? "right" : "left"
                                                }
                                            }),
                                        }
                                    ]}
                                    placeholder={translations[language].picker.searchPlaceholder}
                                    placeholderTextColor={colors.textTertiary}
                                    value={searchValue}
                                    onChangeText={setSearchValue}
                                    autoFocus={true}
                                />
                                {(isLoading && searchValue) && (
                                    <ActivityIndicator size="small" color={colors.primary} />
                                )}
                            </View>
                        )}

                        {/* Clear Button */}
                        {/* {allowClear && (
                            <TouchableOpacity 
                                style={[styles.clearButton, { backgroundColor: colors.danger }]}
                                onPress={handleClearSelection}
                            >
                                <Text style={[styles.clearButtonText, { color: colors.white }]}>
                                    {translations[language].picker.clear}
                                </Text>
                            </TouchableOpacity>
                        )} */}

                        {/* Error State */}
                        {currentError && (
                            <View style={[styles.errorContainer, { backgroundColor: colors.errorBackground }]}>
                                <Text style={[styles.errorText, { color: colors.error }]}>
                                    {currentError}
                                </Text>
                                <TouchableOpacity 
                                    style={[styles.retryButton, { backgroundColor: colors.primary }]}
                                    onPress={handleRetry}
                                >
                                    <Text style={[styles.retryButtonText, { color: colors.white }]}>
                                        {translations[language].picker.retry}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* List */}
                        <View style={styles.listContainer}>
                            <FlatListData
                                data={finalList}
                                loading={isLoading}
                                loadingMore={isLoadingMore}
                                onEndReached={handleLoadMore}
                                onEndReachedThreshold={0.1}
                                onLayout={(event) => {
                                    const { height } = event.nativeEvent.layout;
                                }}
                                onContentSizeChange={(contentWidth, contentHeight) => {
                                }}
                                keyExtractor={keyExtractor}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[styles.listItem, { borderBottomColor: colors.border }]}
                                        onPress={() => {
                                            if (typeof setSelectedValue === 'function') {
                                                setSelectedValue((prevValue) => {
                                                    const newValue = {...prevValue};
                                                    newValue[name] = item;
                                                    return newValue;
                                                });
                                            }
                                            handleCloseModal();
                                        }}
                                    >
                                        <Text style={[styles.listItemText, { color: colors.text }]}>
                                            {item.label || item.name}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom: 20 + insets.bottom }}
                            />
                        </View>
                    </View>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    safeArea: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    contentWrapper: {
        maxHeight: '90%',
        minHeight: '50%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
    },
    closeButton: {
        padding: 5,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 15,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 10,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
    },
    clearButton: {
        margin: 15,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    clearButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorContainer: {
        margin: 15,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    errorText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 10,
    },
    retryButton: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 6,
    },
    retryButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    listContainer: {
        flex: 1,
    },
    listItem: {
        padding: 15,
        borderBottomWidth: 1,
    },
    listItemText: {
        fontSize: 16,
    },
});