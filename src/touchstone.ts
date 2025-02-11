export type SParameterFormat = 'MA' | 'DB' | 'RI' | undefined

/**
 * Class to read touchstone s-parameter files.
 * When $a \ne 0$, there are two solutions to $ax^2 + bx + c = 0$
 * and they are
 * $$
 * x = {-b \pm \sqrt{b^2-4ac} \over 2a}
 * $$
 * 
 * $E=mc^2$
 * 
 * 这是一个行内公式：$E=mc^2$ 。

这是一个块级公式：
$$
\int_{a}^{b} f(x) \,dx
$$

 * 公式为 $A = \pi r^2$，其中 $r$ 是半径
 * 这是一个独立公式：
 * $$
 * d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}
 * $$
 * When \(a \ne 0\), there are two solutions to \(ax^2 + bx + c = 0\)
 * and they are \[x = {-b \pm \sqrt{b^2-4ac} \over 2a}\]
 * 
 * When $a \ne 0$, there are two solutions to $(ax^2 + bx + c = 0)$ and they are
$$ x = {-b \pm \sqrt{b^2-4ac} \over 2a} $$

**Maxwell's equations:**

| equation                                                                                                                                                                  | description                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| $\nabla \cdot \vec{\mathbf{B}}  = 0$                                                                                                                                      | divergence of $\vec{\mathbf{B}}$ is zero                                               |
| $\nabla \times \vec{\mathbf{E}}\, +\, \frac1c\, \frac{\partial\vec{\mathbf{B}}}{\partial t}  = \vec{\mathbf{0}}$                                                          | curl of $\vec{\mathbf{E}}$ is proportional to the rate of change of $\vec{\mathbf{B}}$ |
| $\nabla \times \vec{\mathbf{B}} -\, \frac1c\, \frac{\partial\vec{\mathbf{E}}}{\partial t} = \frac{4\pi}{c}\vec{\mathbf{j}}    \nabla \cdot \vec{\mathbf{E}} = 4 \pi \rho$ | _wha?_                                                                                 |
 *
 * # References
 * - {@link https://ibis.org/touchstone_ver2.1/touchstone_ver2_1.pdf Touchstone(R) File Format Specification (Version 2.1)}
 * - {@link https://books.google.com/books/about/S_Parameters_for_Signal_Integrity.html?id=_dLKDwAAQBAJ S-Parameters for Signal Integrity}
 */
export class Touchstone {}
