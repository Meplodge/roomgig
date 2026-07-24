import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  PanResponder,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import { colors } from '../constants/colors';
import { consumeCropHandler } from '../utils/cropBridge';
import { buildResizeAction, IMAGE_COMPRESS, persistImage } from '../utils/imageOptimizer';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const AREA_W = SCREEN_W - 32;
const AREA_H = Math.round(SCREEN_H * 0.6);
const HANDLE = 28;
const MIN_SIZE = 60;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const ImageCropScreen = ({ route, navigation }) => {
  const { imageUri, imageWidth, imageHeight } = route.params || {};
  const [processing, setProcessing] = useState(false);

  // Compute how the image is displayed (contain) within the crop area
  const layout = useMemo(() => {
    const w = imageWidth || AREA_W;
    const h = imageHeight || AREA_H;
    const scale = Math.min(AREA_W / w, AREA_H / h);
    const dispW = w * scale;
    const dispH = h * scale;
    const offsetX = (AREA_W - dispW) / 2;
    const offsetY = (AREA_H - dispH) / 2;
    return { scale, dispW, dispH, offsetX, offsetY };
  }, [imageWidth, imageHeight]);

  const initialBox = useMemo(() => {
    const w = layout.dispW * 0.8;
    const h = layout.dispH * 0.8;
    return {
      x: layout.offsetX + (layout.dispW - w) / 2,
      y: layout.offsetY + (layout.dispH - h) / 2,
      w,
      h,
    };
  }, [layout]);

  const [box, setBox] = useState(initialBox);
  const boxRef = useRef(initialBox);
  const startRef = useRef(initialBox);

  const updateBox = (next) => {
    boxRef.current = next;
    setBox(next);
  };

  const minX = layout.offsetX;
  const minY = layout.offsetY;
  const maxX = layout.offsetX + layout.dispW;
  const maxY = layout.offsetY + layout.dispH;

  const moveResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startRef.current = boxRef.current;
      },
      onPanResponderMove: (_, gesture) => {
        const s = startRef.current;
        const x = clamp(s.x + gesture.dx, minX, maxX - s.w);
        const y = clamp(s.y + gesture.dy, minY, maxY - s.h);
        updateBox({ ...s, x, y });
      },
    })
  ).current;

  const makeCornerResponder = (corner) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startRef.current = boxRef.current;
      },
      onPanResponderMove: (_, gesture) => {
        const s = startRef.current;
        let { x, y, w, h } = s;

        if (corner === 'tl') {
          const newX = clamp(s.x + gesture.dx, minX, s.x + s.w - MIN_SIZE);
          const newY = clamp(s.y + gesture.dy, minY, s.y + s.h - MIN_SIZE);
          w = s.w + (s.x - newX);
          h = s.h + (s.y - newY);
          x = newX;
          y = newY;
        } else if (corner === 'tr') {
          const newY = clamp(s.y + gesture.dy, minY, s.y + s.h - MIN_SIZE);
          w = clamp(s.w + gesture.dx, MIN_SIZE, maxX - s.x);
          h = s.h + (s.y - newY);
          y = newY;
        } else if (corner === 'bl') {
          const newX = clamp(s.x + gesture.dx, minX, s.x + s.w - MIN_SIZE);
          w = s.w + (s.x - newX);
          h = clamp(s.h + gesture.dy, MIN_SIZE, maxY - s.y);
          x = newX;
        } else if (corner === 'br') {
          w = clamp(s.w + gesture.dx, MIN_SIZE, maxX - s.x);
          h = clamp(s.h + gesture.dy, MIN_SIZE, maxY - s.y);
        }

        updateBox({ x, y, w, h });
      },
    });

  const cornerResponders = useRef({
    tl: makeCornerResponder('tl'),
    tr: makeCornerResponder('tr'),
    bl: makeCornerResponder('bl'),
    br: makeCornerResponder('br'),
  }).current;

  const handleConfirm = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      const current = boxRef.current;
      const originX = Math.round((current.x - layout.offsetX) / layout.scale);
      const originY = Math.round((current.y - layout.offsetY) / layout.scale);
      const cropWidth = Math.round(current.w / layout.scale);
      const cropHeight = Math.round(current.h / layout.scale);

      const safeOriginX = clamp(originX, 0, (imageWidth || cropWidth) - 1);
      const safeOriginY = clamp(originY, 0, (imageHeight || cropHeight) - 1);
      const safeWidth = clamp(cropWidth, 1, (imageWidth || cropWidth) - safeOriginX);
      const safeHeight = clamp(cropHeight, 1, (imageHeight || cropHeight) - safeOriginY);

      const actions = [
        {
          crop: {
            originX: safeOriginX,
            originY: safeOriginY,
            width: safeWidth,
            height: safeHeight,
          },
        },
      ];

      // Auto-optimize: downscale only if the cropped result exceeds the cap,
      // keeping images sharp on phones and 12" tablets without oversized files.
      const resize = buildResizeAction(safeWidth, safeHeight);
      if (resize) actions.push(resize);

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        actions,
        { compress: IMAGE_COMPRESS, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Move out of the evictable cache dir so the file still exists when the
      // listing is submitted and its bytes are read for upload.
      let finalUri = result.uri;
      try {
        finalUri = persistImage(result.uri);
      } catch (persistErr) {
        console.warn('Persisting cropped image failed, using temp uri:', persistErr);
      }

      const handler = consumeCropHandler();
      if (handler) {
        handler(finalUri);
      }
      navigation.goBack();
    } catch (e) {
      console.error('Error cropping image:', e);
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crop Image</Text>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.areaWrapper}>
        <View style={styles.area}>
          <Image
            source={{ uri: imageUri }}
            style={{
              position: 'absolute',
              left: layout.offsetX,
              top: layout.offsetY,
              width: layout.dispW,
              height: layout.dispH,
            }}
            resizeMode="contain"
          />

          {/* Crop box */}
          <View
            style={[
              styles.cropBox,
              { left: box.x, top: box.y, width: box.w, height: box.h },
            ]}
            {...moveResponder.panHandlers}
          >
            {/* Grid lines */}
            <View style={[styles.gridLine, styles.gridVertical, { left: '33.33%' }]} />
            <View style={[styles.gridLine, styles.gridVertical, { left: '66.66%' }]} />
            <View style={[styles.gridLine, styles.gridHorizontal, { top: '33.33%' }]} />
            <View style={[styles.gridLine, styles.gridHorizontal, { top: '66.66%' }]} />

            {/* Corner handles */}
            <View
              style={[styles.handle, styles.handleTL]}
              {...cornerResponders.tl.panHandlers}
            />
            <View
              style={[styles.handle, styles.handleTR]}
              {...cornerResponders.tr.panHandlers}
            />
            <View
              style={[styles.handle, styles.handleBL]}
              {...cornerResponders.bl.panHandlers}
            />
            <View
              style={[styles.handle, styles.handleBR]}
              {...cornerResponders.br.panHandlers}
            />
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.hint}>Drag the corners to adjust your crop</Text>
        <TouchableOpacity
          style={[styles.confirmButton, processing && styles.confirmDisabled]}
          onPress={handleConfirm}
          disabled={processing}
          activeOpacity={0.9}
        >
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={22} color="#fff" />
              <Text style={styles.confirmText}>Confirm Crop</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  areaWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  area: {
    width: AREA_W,
    height: AREA_H,
    backgroundColor: '#111',
    overflow: 'hidden',
  },
  cropBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  gridLine: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.4)' },
  gridVertical: { top: 0, bottom: 0, width: 1 },
  gridHorizontal: { left: 0, right: 0, height: 1 },
  handle: {
    position: 'absolute',
    width: HANDLE,
    height: HANDLE,
    backgroundColor: colors.primary,
    borderRadius: HANDLE / 2,
    borderWidth: 2,
    borderColor: '#fff',
  },
  handleTL: { top: -HANDLE / 2, left: -HANDLE / 2 },
  handleTR: { top: -HANDLE / 2, right: -HANDLE / 2 },
  handleBL: { bottom: -HANDLE / 2, left: -HANDLE / 2 },
  handleBR: { bottom: -HANDLE / 2, right: -HANDLE / 2 },
  footer: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 },
  hint: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center', marginBottom: 14 },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 28,
  },
  confirmDisabled: { opacity: 0.7 },
  confirmText: { color: '#fff', fontSize: 17, fontWeight: '700', marginLeft: 8 },
});

export default ImageCropScreen;
