import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList } from "react-native"

const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func(...args);
        }, delay);
    };
};

export default function FlatListData({list,loadMoreData,loadingMore,children}){
    const [isFetching, setIsFetching] = useState(false);

    const handleLoadMore = useCallback(
        debounce(() => {
            if (!isFetching) {
                setIsFetching(true);
                loadMoreData().finally(() => {
                    setIsFetching(false);
                });
            }
        }, 300),
        [isFetching, loadMoreData]
    );

    return <FlatList
            data={list || []} 
            keyExtractor={(item,index) => index.toString()}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={10}
            renderItem={({ item }) => children(item)}
        ListFooterComponent={
            loadingMore ? <ActivityIndicator size="small" color="#F8C332" /> : null
        }
    />
}