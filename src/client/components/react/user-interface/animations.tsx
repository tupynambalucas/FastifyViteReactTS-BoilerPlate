import gsap from 'gsap';

interface AnimationConfig {
  position: string;
  height: number | string;
  duration: number;
}

interface HeaderAnimationProps {
  ref: HTMLDivElement;
  screenState: {
    headerDisplay: boolean;
  };
  animation: AnimationConfig;
}

interface ScreenAnimationProps {
    ref: HTMLDivElement;
}


// --- Animation Functions ---

export function headerHeightAnimation (props: HeaderAnimationProps) {
    const { ref, screenState, animation } = props

    gsap.to(ref.children, {
        opacity: screenState.headerDisplay ? 1 : 0,
        duration: screenState.headerDisplay ? 2 : 1, // Animation duration in seconds
        ease: screenState.headerDisplay ? "power1.in" : 'power1.out', // Easing function
        stagger: 0.2, // Animate children with a 0.2-second delay between each     
    });

    gsap.to(ref, {
        position: animation.position,
        height: animation.height, // Target height
        duration: animation.duration, // Animation duration in seconds
        ease: "power2.inOut", // Easing function
        onComplete: () => console.log('Height animation complete!')
    });
}

export function screenAnimation (props: ScreenAnimationProps) {
    const { ref } = props
    const elements = ref.querySelector('[data-animation]');
    console.log(elements)
    if (ref.dataset.animation) {
        const animation = JSON.parse(ref.dataset.animation)
        console.log(animation)
    }

    // The rest of your animation logic would go here.
    // For example:
    /*
     gsap.to(elements, {
        // animation properties
    });
    */
}