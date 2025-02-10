/**
 * Class to read touchstone s-parameter files.<br>
 * When \\(a \ne 0\\), there are two solutions to \(ax^2 + bx + c = 0\) 
 * and they are $$x = {-b \pm \sqrt{b^2-4ac} \over 2a}.$$
 * <br>
 * 公式为 $A = \pi r^2$，其中 $r$ 是半径
 * 这是一个独立公式：
 * $$
 * d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}
 * $$
 * When \\(a \ne 0\\), there are two solutions to \\(ax^2 + bx + c = 0\\) 
 * and they are \\[x = {-b \pm \sqrt{b^2-4ac} \over 2a}.\\]
 *
 * # References
 * - {@link https://ibis.org/touchstone_ver2.1/touchstone_ver2_1.pdf Touchstone(R) File Format Specification (Version 2.1)}
 * - {@link https://books.google.com/books/about/S_Parameters_for_Signal_Integrity.html?id=_dLKDwAAQBAJ S-Parameters for Signal Integrity}

 */
export type SParameterFormat = 'MA' | 'DB' | 'RI' | undefined

// export const Touchstone = () => {
//   return {}
// }
