'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './components.module.css';

interface Step {
  targetId: string;
  title: string;
  content: string;
}

export default function OnboardingTour() {
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const tourRef = useRef<HTMLDivElement>(null);

  const steps: Step[] = [
    {
      targetId: 'guide-header',
      title: 'Thanh Điều Hướng Chính',
      content: 'Chào mừng bạn! Đây là nơi bạn có thể chuyển hướng nhanh giữa Trang chủ, Đọc bài viết Blog và truy cập Trang quản trị Admin.',
    },
    {
      targetId: 'guide-categories',
      title: 'Lọc Theo Danh Mục',
      content: 'Bạn có thể lọc nhanh các ứng dụng theo từng chủ đề yêu thích bằng cách nhấp chọn danh mục tại đây.',
    },
    {
      targetId: 'guide-search',
      title: 'Tìm Kiếm Tiện Lợi',
      content: 'Tìm kiếm ứng dụng mong muốn trong nháy mắt bằng cách gõ tên ứng dụng vào ô tìm kiếm này.',
    },
    {
      targetId: 'guide-apps',
      title: 'Danh Sách Ứng Dụng',
      content: 'Tất cả ứng dụng được liệt kê tại đây. Ứng dụng "Mở" cho phép tải tự do, còn ứng dụng "Khóa" sẽ cần Key để tải xuống.',
    },
    {
      targetId: 'guide-blog',
      title: 'Bài Viết Chia Sẻ',
      content: 'Nhấp vào đây để xem các bài viết hướng dẫn chi tiết, thủ thuật công nghệ hoặc tin tức mới nhất.',
    },
  ];

  const handleComplete = useCallback(() => {
    setCurrentStep(-1);
    localStorage.setItem('onboarding_completed', 'true');
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, steps.length, handleComplete]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  useEffect(() => {
    // Check if the user has completed the tour before
    const hasSeenTour = localStorage.getItem('onboarding_completed');
    if (!hasSeenTour) {
      // Small delay to ensure everything is rendered
      const timer = setTimeout(() => {
        setCurrentStep(0);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (currentStep < 0 || currentStep >= steps.length) return;

    const updatePosition = () => {
      const step = steps[currentStep];
      const element = document.getElementById(step.targetId);

      if (element) {
        // Scroll element into view smoothly if it's off-screen
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Wait a brief moment for scroll to complete
        setTimeout(() => {
          const rect = element.getBoundingClientRect();
          const scrollTop = window.scrollY || document.documentElement.scrollTop;
          const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

          // Set highlight position (dashed border overlay)
          const margin = 6;
          setHighlightStyle({
            top: rect.top + scrollTop - margin,
            left: rect.left + scrollLeft - margin,
            width: rect.width + margin * 2,
            height: rect.height + margin * 2,
            opacity: 1,
            display: 'block',
          });

          // Position the tooltip
          let tooltipTop = rect.bottom + scrollTop + 15;
          let tooltipLeft = rect.left + scrollLeft + (rect.width - 320) / 2;

          // Boundary checks
          if (tooltipLeft < 10) tooltipLeft = 10;
          if (tooltipLeft + 320 > window.innerWidth) {
            tooltipLeft = window.innerWidth - 330;
          }

          // If element is near bottom, place tooltip above it
          if (rect.bottom + 250 > window.innerHeight) {
            tooltipTop = rect.top + scrollTop - 200;
          }

          setTooltipStyle({
            top: tooltipTop,
            left: tooltipLeft,
            opacity: 1,
            display: 'block',
          });
        }, 300);
      } else {
        // If element is not found, skip to the next step
        handleNext();
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [currentStep, handleNext, steps]);

  if (currentStep < 0) return null;

  const currentStepData = steps[currentStep];

  return (
    <div className={styles.tourOverlay} ref={tourRef}>
      {/* Highlight Box */}
      <div className={styles.tourHighlight} style={highlightStyle} />

      {/* Tooltip Box */}
      <div className={styles.tourTooltip} style={tooltipStyle}>
        <div className={styles.tourStep}>
          Bước {currentStep + 1} / {steps.length}
        </div>
        <h3 className={styles.tourTitle}>{currentStepData?.title}</h3>
        <p className={styles.tourContent}>{currentStepData?.content}</p>
        <div className={styles.tourButtons}>
          <button className={styles.tourSkip} onClick={handleSkip}>
            Bỏ qua hướng dẫn
          </button>
          <button className={styles.tourNext} onClick={handleNext}>
            {currentStep === steps.length - 1 ? 'Hoàn tất' : 'Tiếp theo'}
          </button>
        </div>
      </div>
    </div>
  );
}
